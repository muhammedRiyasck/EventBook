import Booking from '../models/Booking';
import User from '../models/User';
import Service from '../models/Service';
import stripe from '../config/stripe';
import appEvents from '../utils/eventEmitter';
import bookingRepository from '../repositories/BookingRepository';
import { NotFoundError, BadRequestError } from '../errors/AppError';
import { IBooking } from '../models/Booking';

export interface TransactionQuery {
  page?: string;
  limit?: string;
  paymentStatus?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
}

export interface PaginatedTransactions {
  data: IBooking[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * AdminPaymentService — revenue reports, transaction queries, admin refunds.
 * Added to PaymentService domain to keep all payment logic in the service layer.
 */
export class AdminPaymentService {
  async getTransactions(query: TransactionQuery): Promise<PaginatedTransactions> {
    const {
      page = '1', limit = '15',
      paymentStatus = 'all', status = 'all',
      search = '', startDate = '', endDate = '', sort = '-createdAt',
    } = query;

    const filter: Record<string, unknown> = {
      paymentStatus: { $in: ['paid', 'refunded', 'partially_refunded'] },
    };

    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
    if (status && status !== 'all') filter.status = status;

    if (search.trim().startsWith('pi_')) {
      filter.stripePaymentIntentId = search.trim();
    } else if (search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      const [matchedUsers, matchedServices] = await Promise.all([
        User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id'),
        Service.find({ title: regex }).select('_id'),
      ]);
      const orConditions: Record<string, unknown>[] = [
        { user: { $in: matchedUsers.map((u) => u._id) } },
        { service: { $in: matchedServices.map((s) => s._id) } },
      ];
      if (/^[0-9a-fA-F]{24}$/.test(s)) orConditions.push({ _id: s });
      filter.$or = orConditions;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      filter.createdAt = dateFilter;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const allowedSorts: Record<string, string> = {
      '-createdAt': '-createdAt', createdAt: 'createdAt',
      '-totalPrice': '-totalPrice', totalPrice: 'totalPrice',
    };
    const sortField = allowedSorts[sort] || '-createdAt';

    const [data, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email phone')
        .populate('service', 'title category location pricePerDay bookingMode pricingUnit')
        .sort(sortField)
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(Math.max(total, 1) / limitNum);
    return {
      data,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  async getTransactionById(bookingId: string) {
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('service', 'title category location pricePerDay images contact bookingMode pricingUnit');

    if (!booking) throw new NotFoundError('Transaction not found');

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

    return { booking, stripeDetails };
  }

  async getRevenueSummary(period = '30') {
    const days = Math.min(365, Math.max(1, parseInt(period)));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [overview, dailyRevenue, topServices, refundStats] = await Promise.all([
      Booking.aggregate([
        {
          $facet: {
            totalRevenue: [
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
        { $group: { _id: '$service', revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
        { $unwind: '$service' },
        { $project: { title: '$service.title', category: '$service.category', revenue: 1, bookings: 1 } },
      ]),
      Booking.aggregate([
        { $match: { refundStatus: 'succeeded' } },
        {
          $group: {
            _id: null,
            totalRefunded: { $sum: '$refundAmount' },
            refundCount: { $sum: 1 },
            fullRefunds: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, 1, 0] } },
            partialRefunds: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'partially_refunded'] }, 1, 0] } },
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

    return {
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
    };
  }

  async getRefunds(page = '1', limit = '15', status = 'all') {
    const filter: Record<string, unknown> = {
      refundStatus: { $in: ['succeeded', 'pending', 'failed'] },
    };
    if (status !== 'all') filter.refundStatus = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email phone')
        .populate('service', 'title category')
        .sort('-refundedAt')
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(Math.max(total, 1) / limitNum);
    return {
      data,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  async issueAdminRefund(bookingId: string, amount?: number, reason?: string) {
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('service', 'title');

    if (!booking) throw new NotFoundError('Transaction not found');
    if (!booking.stripePaymentIntentId) {
      throw new BadRequestError('No Stripe payment associated with this booking');
    }
    if (booking.paymentStatus === 'unpaid') {
      throw new BadRequestError('Cannot refund an unpaid booking');
    }
    if (booking.paymentStatus === 'refunded') {
      throw new BadRequestError('This booking has already been fully refunded');
    }

    const maxRefundable = booking.totalPrice - (booking.refundAmount || 0);
    const refundRupees = amount ? Math.min(amount, maxRefundable) : maxRefundable;

    if (refundRupees <= 0) throw new BadRequestError('No refundable amount remaining');

    const refund = await stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      amount: Math.round(refundRupees * 100),
      reason: 'requested_by_customer',
      metadata: { bookingId: booking._id.toString(), adminReason: reason || '' },
    });

    const isFullRefund = refundRupees >= booking.totalPrice;
    booking.refundId = refund.id;
    booking.refundAmount = (booking.refundAmount || 0) + refundRupees;
    booking.refundReason = reason || '';
    booking.refundStatus = refund.status as 'none' | 'pending' | 'succeeded' | 'failed';
    booking.refundedAt = new Date();
    booking.paymentStatus = isFullRefund ? 'refunded' : 'partially_refunded';
    if (isFullRefund) booking.status = 'cancelled';
    await bookingRepository.save(booking);

    const user = booking.user as unknown as { name: string; email: string };
    const service = booking.service as unknown as { title: string };

    appEvents.emit('booking.refunded', {
      userName: user.name,
      userEmail: user.email,
      serviceName: service.title,
      refundAmount: refundRupees,
      totalPrice: booking.totalPrice,
      isFullRefund,
      reason: reason || 'No reason provided',
      bookingId: booking._id.toString(),
    });

    return { booking, refund: { id: refund.id, amount: refundRupees, status: refund.status } };
  }
}

export default new AdminPaymentService();
