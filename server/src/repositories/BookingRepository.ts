import Booking, { IBooking, BookingStatus } from '../models/Booking';
import { Types } from 'mongoose';
import { IBookingRepository, BookingRevenueAggregates } from './interfaces/IBookingRepository';

const SERVICE_POPULATE_FIELDS =
  'title category location pricePerDay images contact bookingMode pricingUnit cancellationPolicy';

export interface BookingConflictQuery {
  serviceId: string;
  start: Date;
  end: Date;
  userId: string | Types.ObjectId;
  timeSlotId?: string;
}

/**
 * BookingRepository — all Mongoose queries for the Booking collection.
 * Encapsulates query logic
 */
export class BookingRepository implements IBookingRepository {
  async findById(id: string): Promise<IBooking | null> {
    return Booking.findById(id);
  }

  async findByIdWithService(
    id: string,
    serviceFields = SERVICE_POPULATE_FIELDS
  ): Promise<IBooking | null> {
    return Booking.findById(id).populate('service', serviceFields);
  }

  async findByIdWithUserAndService(id: string): Promise<IBooking | null> {
    return Booking.findById(id)
      .populate('user', 'name email phone')
      .populate('service', `${SERVICE_POPULATE_FIELDS} timeSlots`);
  }

  async findByUser(
    query: Record<string, unknown>,
    skip: number,
    limit: number
  ): Promise<[IBooking[], number]> {
    return Promise.all([
      Booking.find(query)
        .populate('service', SERVICE_POPULATE_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);
  }

  async findAll(
    query: Record<string, unknown>,
    skip: number,
    limit: number
  ): Promise<[IBooking[], number]> {
    return Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('service', `${SERVICE_POPULATE_FIELDS}`)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);
  }

  async create(data: Partial<IBooking>): Promise<IBooking> {
    return Booking.create(data);
  }

  /** Atomically confirm an unpaid pending booking (used by webhook & retry). */
  async atomicConfirm(
    bookingId: string,
    stripePaymentIntentId: string,
    statusHistory: object
  ): Promise<IBooking | null> {
    return Booking.findOneAndUpdate(
      { _id: bookingId, paymentStatus: 'unpaid', status: 'pending' },
      {
        $set: { paymentStatus: 'paid', status: 'confirmed', stripePaymentIntentId },
        $unset: { pendingStripePaymentIntentId: 1 },
        $push: { statusHistory },
      },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('service', 'title');
  }

  /** Atomically update status with optimistic concurrency via the current status filter. */
  async atomicStatusUpdate(
    id: string,
    fromStatus: BookingStatus,
    toStatus: BookingStatus,
    historyEntry: object,
    extraFields?: Record<string, unknown>
  ): Promise<IBooking | null> {
    return Booking.findOneAndUpdate(
      { _id: id, status: fromStatus },
      {
        $set: { status: toStatus, ...extraFields },
        $push: { statusHistory: historyEntry },
      },
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('service', 'title');
  }

  async save(booking: IBooking): Promise<IBooking> {
    return booking.save();
  }

  async countSlotBookings(
    serviceId: string,
    timeSlotId: string,
    dayStart: Date,
    dayEnd: Date
  ): Promise<number> {
    return Booking.countDocuments({
      service: serviceId,
      timeSlotId,
      startDate: { $gte: dayStart, $lt: dayEnd },
      status: { $nin: ['cancelled'] },
    });
  }

  async countDayBookings(serviceId: string, dayStart: Date, dayEnd: Date): Promise<number> {
    return Booking.countDocuments({
      service: serviceId,
      startDate: { $gte: dayStart, $lt: dayEnd },
      status: { $nin: ['cancelled'] },
    });
  }

  async findExistingPending(
    userId: string | Types.ObjectId,
    serviceId: string,
    start: Date,
    end: Date,
    timeSlotId?: string
  ): Promise<IBooking | null> {
    return Booking.findOne({
      user: userId,
      service: serviceId,
      status: 'pending',
      paymentStatus: 'unpaid',
      startDate: { $lte: end },
      endDate: { $gte: start },
      ...(timeSlotId && { timeSlotId }),
    }).select('_id');
  }

  async findConfirmedDuplicate(
    userId: string | Types.ObjectId,
    serviceId: string,
    start: Date,
    end: Date
  ): Promise<IBooking | null> {
    return Booking.findOne({
      user: userId,
      service: serviceId,
      status: { $in: ['confirmed', 'completed'] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });
  }

  /** Fetch bookings for slot-availability computation. */
  async findForSlotAvailability(
    serviceId: string,
    dayStart: Date,
    dayEnd: Date
  ): Promise<Pick<IBooking, 'timeSlotId' | 'guestCount'>[]> {
    return Booking.find({
      service: serviceId,
      startDate: { $gte: dayStart, $lt: dayEnd },
      status: { $nin: ['cancelled'] },
    }).select('timeSlotId guestCount');
  }

  async findByIdWithFullDetails(id: string): Promise<IBooking | null> {
    return Booking.findById(id)
      .populate('user', 'name email phone')
      .populate('service', 'title category location pricePerDay images contact bookingMode pricingUnit');
  }

  async findPaginatedTransactions(
    filter: Record<string, unknown>,
    sortField: string,
    skip: number,
    limit: number
  ): Promise<[IBooking[], number]> {
    return Promise.all([
      Booking.find(filter)
        .populate('user', 'name email phone')
        .populate('service', 'title category location pricePerDay bookingMode pricingUnit')
        .sort(sortField)
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);
  }

  async getRevenueSummaryAggregates(
    sinceDate: Date,
    dailySkip: number,
    dailyLimit: number,
    servicesSkip: number,
    servicesLimit: number
  ): Promise<BookingRevenueAggregates> {
    const [overview, dailyResult, servicesResult, refundStats] = await Promise.all([
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
                  createdAt: { $gte: sinceDate },
                },
              },
              { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
            ],
          },
        },
      ]),
      // Daily revenue: use $facet to get both the paginated slice and total count
      Booking.aggregate([
        {
          $match: {
            paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] },
            createdAt: { $gte: sinceDate },
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
        {
          $facet: {
            data: [{ $skip: dailySkip }, { $limit: dailyLimit }],
            total: [{ $count: 'count' }],
          },
        },
      ]),
      // Top services: use $facet to get both the paginated slice and total count
      Booking.aggregate([
        { $match: { paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] } } },
        { $group: { _id: '$service', revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
        { $unwind: '$service' },
        { $project: { title: '$service.title', category: '$service.category', revenue: 1, bookings: 1 } },
        {
          $facet: {
            data: [{ $skip: servicesSkip }, { $limit: servicesLimit }],
            total: [{ $count: 'count' }],
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
            fullRefunds: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, 1, 0] } },
            partialRefunds: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'partially_refunded'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const dailyRevenue = dailyResult[0]?.data || [];
    const totalDailyRows: number = dailyResult[0]?.total?.[0]?.count || 0;
    const topServices = servicesResult[0]?.data || [];
    const totalTopServices: number = servicesResult[0]?.total?.[0]?.count || 0;

    return {
      overview,
      dailyRevenue,
      totalDailyRows,
      topServices,
      totalTopServices,
      refundStats,
    };
  }

  async findRefunds(
    filter: Record<string, unknown>,
    skip: number,
    limit: number
  ): Promise<[IBooking[], number]> {
    return Promise.all([
      Booking.find(filter)
        .populate('user', 'name email phone')
        .populate('service', 'title category')
        .sort('-refundedAt')
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);
  }
}

export default new BookingRepository();
