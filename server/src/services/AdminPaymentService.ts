import stripe from '../config/stripe';
import appEvents from '../utils/eventEmitter';
import bookingRepository from '../repositories/BookingRepository';
import userRepository from '../repositories/UserRepository';
import serviceRepository from '../repositories/ServiceRepository';
import { IBookingRepository } from '../repositories/interfaces/IBookingRepository';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { IServiceRepository } from '../repositories/interfaces/IServiceRepository';
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
 */
export class AdminPaymentService {
  constructor(
    private readonly bookingRepo: IBookingRepository = bookingRepository,
    private readonly userRepo: IUserRepository = userRepository,
    private readonly serviceRepo: IServiceRepository = serviceRepository
  ) {}

  async getTransactions(query: TransactionQuery): Promise<PaginatedTransactions> {
    const {
      page = '1',
      limit = '15',
      paymentStatus = 'all',
      status = 'all',
      search = '',
      startDate = '',
      endDate = '',
      sort = '-createdAt',
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
        this.userRepo.findIdsByRegex(regex),
        this.serviceRepo.findIdsByRegex(regex),
      ]);
      const orConditions: Record<string, unknown>[] = [
        { user: { $in: matchedUsers } },
        { service: { $in: matchedServices } },
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
      '-createdAt': '-createdAt',
      createdAt: 'createdAt',
      '-totalPrice': '-totalPrice',
      totalPrice: 'totalPrice',
    };
    const sortField = allowedSorts[sort] || '-createdAt';

    const [data, total] = await this.bookingRepo.findPaginatedTransactions(
      filter,
      sortField,
      skip,
      limitNum
    );

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
    const booking = await this.bookingRepo.findByIdWithFullDetails(bookingId);

    if (!booking) throw new NotFoundError('Transaction not found');

    let stripeDetails: Record<string, unknown> | null = null;
    if (booking.stripePaymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId, {
          expand: ['charges'],
        });
        const charge = (
          pi as unknown as {
            charges?: {
              data?: Array<{
                receipt_url?: string;
                payment_method_details?: { card?: { last4?: string; brand?: string } };
                id?: string;
              }>;
            };
          }
        ).charges?.data?.[0];
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

  async getRevenueSummary(
    period = '30',
    dailyPage = '1',
    dailyLimit = '10',
    servicesPage = '1',
    servicesLimit = '10'
  ) {
    const days = Math.min(365, Math.max(1, parseInt(period)));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const dPageNum = Math.max(1, parseInt(dailyPage));
    const dLimitNum = Math.min(100, Math.max(1, parseInt(dailyLimit)));
    const sPageNum = Math.max(1, parseInt(servicesPage));
    const sLimitNum = Math.min(100, Math.max(1, parseInt(servicesLimit)));

    const { overview, dailyRevenue, totalDailyRows, topServices, totalTopServices, refundStats } =
      await this.bookingRepo.getRevenueSummaryAggregates(
        since,
        (dPageNum - 1) * dLimitNum,
        dLimitNum,
        (sPageNum - 1) * sLimitNum,
        sLimitNum
      );

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
      dailyPagination: {
        currentPage: dPageNum,
        totalPages: Math.ceil(Math.max(totalDailyRows, 1) / dLimitNum),
        totalItems: totalDailyRows,
        itemsPerPage: dLimitNum,
        hasNextPage: dPageNum < Math.ceil(Math.max(totalDailyRows, 1) / dLimitNum),
        hasPrevPage: dPageNum > 1,
      },
      topServices,
      servicesPagination: {
        currentPage: sPageNum,
        totalPages: Math.ceil(Math.max(totalTopServices, 1) / sLimitNum),
        totalItems: totalTopServices,
        itemsPerPage: sLimitNum,
        hasNextPage: sPageNum < Math.ceil(Math.max(totalTopServices, 1) / sLimitNum),
        hasPrevPage: sPageNum > 1,
      },
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

    const [data, total] = await this.bookingRepo.findRefunds(filter, skip, limitNum);

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
    const booking = await this.bookingRepo.findByIdWithFullDetails(bookingId);

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
    await this.bookingRepo.save(booking);

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
