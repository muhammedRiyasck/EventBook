import Booking, { IBooking, BookingStatus } from '../models/Booking';
import { Types } from 'mongoose';

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
export class BookingRepository {
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
}

export default new BookingRepository();
