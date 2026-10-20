import { Response, NextFunction } from 'express';
import Booking from '../../models/Booking';
import User from '../../models/User';
import Service from '../../models/Service';
import stripe from '../../config/stripe';
import { AuthRequest } from '../../middleware/auth';

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, string>) {
  const query: Record<string, unknown> = {};

  // Only include transactions that have been paid (online payments only)
  query.paymentStatus = { $in: ['paid', 'refunded', 'partially_refunded'] };

  if (params.paymentStatus && params.paymentStatus !== 'all') {
    query.paymentStatus = params.paymentStatus;
  }

  if (params.status && params.status !== 'all') {
    query.status = params.status;
  }

  if (params.search) {
    const s = params.search.trim();
    if (s.startsWith('pi_')) {
      query.stripePaymentIntentId = s;
    }
  }

  if (params.startDate || params.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (params.startDate) dateFilter.$gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    query.createdAt = dateFilter;
  }

  return query;
}

/**
 * @desc    Get all online transactions with search/filter/pagination
 * @route   GET /api/payments/transactions
 * @access  Private/Admin
 */
export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '15',
      paymentStatus = 'all',
      status = 'all',
      search = '',
      startDate = '',
      endDate = '',
      sort = '-createdAt',
    } = req.query as Record<string, string>;

    const query = buildQuery({ paymentStatus, status, search, startDate, endDate });

    // Database-level search on user name / email / service title / booking ID
    if (search && !search.trim().startsWith('pi_')) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      const [matchedUsers, matchedServices] = await Promise.all([
        User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id'),
        Service.find({ title: regex }).select('_id'),
      ]);
      const userIds = matchedUsers.map((u) => u._id);
      const serviceIds = matchedServices.map((s) => s._id);

      const orConditions: Record<string, unknown>[] = [
        { user: { $in: userIds } },
        { service: { $in: serviceIds } },
      ];

      if (/^[0-9a-fA-F]{24}$/.test(s)) {
        orConditions.push({ _id: s });
      }

      query.$or = orConditions;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const allowedSorts: Record<string, string> = {
      '-createdAt': '-createdAt',
      'createdAt': 'createdAt',
      '-totalPrice': '-totalPrice',
      'totalPrice': 'totalPrice',
    };
    const sortField = allowedSorts[sort] || '-createdAt';

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('service', 'title category location pricePerDay bookingMode pricingUnit')
        .sort(sortField)
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(Math.max(total, 1) / limitNum),
        totalItems: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single transaction details (booking + Stripe PI details)
 * @route   GET /api/payments/transactions/:id
 * @access  Private/Admin
 */
export const getTransactionById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('service', 'title category location pricePerDay images contact bookingMode pricingUnit');

    if (!booking) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    let stripeDetails: Record<string, unknown> | null = null;
    if (booking.stripePaymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId, {
          expand: ['charges'],
        });
        const charge = (pi as unknown as { charges?: { data?: Array<{ receipt_url?: string; payment_method_details?: { card?: { last4?: string; brand?: string } }; id?: string }> } }).charges?.data?.[0];
        stripeDetails = {
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          created: pi.created,
          receiptUrl: charge?.receipt_url || null,
          paymentMethod: pi.payment_method_types?.[0] || 'card',
          last4: charge?.payment_method_details?.card?.last4 || null,
          brand: charge?.payment_method_details?.card?.brand || null,
          chargeId: charge?.id || null,
        };
      } catch {
        // Stripe fetch failed — gracefully continue
      }
    }

    res.status(200).json({
      success: true,
      data: booking,
      stripeDetails,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revenue summary and report
 * @route   GET /api/payments/summary
 * @access  Private/Admin
 */
export const getRevenueSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { period = '30' } = req.query as Record<string, string>;
    const days = Math.min(365, Math.max(1, parseInt(period)));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [overview, dailyRevenue, topServices, refundStats] = await Promise.all([
      Booking.aggregate([
        {
          $facet: {
            totalRevenue: [
              // Gross revenue is every successful charge, including charges that
              // were later refunded. Refunds are deducted separately for net revenue.
              { $match: { paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] } } },
              { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
            ],
            periodRevenue: [
              {
                $match: {
                  paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] },
                  createdAt: { $gte: since },
                },
              },
              { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
            ],
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] },
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
            refunds: {
              $sum: {
                $cond: [
                  { $eq: ['$refundStatus', 'succeeded'] },
                  { $ifNull: ['$refundAmount', 0] },
                  0,
                ],
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Booking.aggregate([
        { $match: { paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] } } },
        {
          $group: {
            _id: '$service',
            revenue: { $sum: '$totalPrice' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: '_id',
            as: 'service',
          },
        },
        { $unwind: '$service' },
        {
          $project: {
            title: '$service.title',
            category: '$service.category',
            revenue: 1,
            bookings: 1,
          },
        },
      ]),

      Booking.aggregate([
        { $match: { refundStatus: 'succeeded' } },
        {
          $group: {
            _id: null,
            totalRefunded: { $sum: '$refundAmount' },
            refundCount: { $sum: 1 },
            fullRefunds: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, 1, 0] },
            },
            partialRefunds: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'partially_refunded'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const o = overview[0];
    const grossRevenue = o?.totalRevenue?.[0]?.total || 0;
    const totalTransactions = o?.totalRevenue?.[0]?.count || 0;
    const refundedRevenue = refundStats?.[0]?.totalRefunded || 0;
    const refundCount = refundStats?.[0]?.refundCount || 0;
    const periodRevenue = o?.periodRevenue?.[0]?.total || 0;
    const periodTransactions = o?.periodRevenue?.[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        // Keep the shape consumed by the admin dashboard. These values are
        // deliberately aggregated at request time, so no stale revenue totals
        // need to be stored on individual bookings.
        overview: {
          totalRevenue: grossRevenue,
          totalTransactions,
          refundedRevenue,
          refundCount,
          netRevenue: grossRevenue - refundedRevenue,
          periodRevenue,
          periodTransactions,
        },
        dailyRevenue,
        topServices,
        refundStats: {
          totalRefunded: refundedRevenue,
          count: refundCount,
          fullRefunds: refundStats?.[0]?.fullRefunds || 0,
          partialRefunds: refundStats?.[0]?.partialRefunds || 0,
        },
        period: days,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get refund report
 * @route   GET /api/payments/refunds
 * @access  Private/Admin
 */
export const getRefunds = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '15', status = 'all' } = req.query as Record<string, string>;

    const query: Record<string, unknown> = {
      refundStatus: { $in: ['succeeded', 'pending', 'failed'] },
    };

    if (status !== 'all') {
      query.refundStatus = status;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [refunds, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('service', 'title category')
        .sort('-refundedAt')
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: refunds,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(Math.max(total, 1) / limitNum),
        totalItems: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
