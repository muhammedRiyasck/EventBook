import stripe from '../config/stripe';
import appEvents from '../utils/eventEmitter';
import bookingRepository from '../repositories/BookingRepository';
import serviceRepository from '../repositories/ServiceRepository';
import {
  calculateTotalDays,
  calculateTotalHours,
  calculateTotalPrice,
} from '../utils/priceCalculator';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from '../errors/AppError';
import { CreateBookingDto, UpdateBookingStatusDto, GetMyBookingsQueryDto, GetAllBookingsQueryDto } from '../dto/booking.dto';
import { IUser } from '../models/User';
import { IBooking, BookingStatus } from '../models/Booking';

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage?: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * BookingService — all booking domain business logic.
 * No Mongoose imports. No req/res. Pure business rules.
 */
export class BookingService {
  /**
   * Create a new booking with full validation:
   * - date validation
   * - availability window check
   * - time slot check
   * - max bookings per day
   * - guest/capacity check
   * - duplicate / pending booking guard
   * - atomic reservation
   * - Stripe PaymentIntent creation
   */
  async createBooking(
    user: IUser,
    dto: CreateBookingDto
  ): Promise<{ booking: IBooking; clientSecret: string | null }> {
    if (user.role === 'admin') {
      throw new ForbiddenError('Administrators cannot book services');
    }

    const { serviceId, startDate, endDate, notes, guestCount, timeSlotId } = dto;

    const service = await serviceRepository.findActive(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found or is currently unavailable');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // ── Date Validations ───────────────────────────────────────────────────
    if (start > end) {
      throw new BadRequestError('End date cannot be before start date');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);

    if (startDay < todayStart) {
      throw new BadRequestError('Start date cannot be in the past');
    }

    if (service.availableFrom) {
      const availFrom = new Date(service.availableFrom);
      availFrom.setHours(0, 0, 0, 0);
      if (startDay < availFrom) {
        throw new BadRequestError(
          `This service is only available starting from ${availFrom.toLocaleDateString('en-IN')}`
        );
      }
    }

    if (service.availableTo) {
      const availTo = new Date(service.availableTo);
      availTo.setHours(23, 59, 59, 999);
      const endDay = new Date(end);
      endDay.setHours(0, 0, 0, 0);
      if (endDay > availTo) {
        throw new BadRequestError(
          `This service is only available until ${availTo.toLocaleDateString('en-IN')}`
        );
      }
    }

    // ── Time Slot Validations ──────────────────────────────────────────────
    let resolvedSlot: { _id: string; label: string; startTime: string; endTime: string } | null = null;
    let totalHours = 0;

    if (service.bookingMode === 'time_slot') {
      if (!timeSlotId) {
        throw new BadRequestError('Please select a time slot for this service');
      }

      const slot = service.timeSlots.find(
        (s) => s._id.toString() === timeSlotId && s.isActive
      );
      if (!slot) {
        throw new BadRequestError('Invalid or unavailable time slot selected');
      }

      resolvedSlot = {
        _id: slot._id.toString(),
        label: slot.label,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
      totalHours = calculateTotalHours(slot.startTime, slot.endTime);

      const dayStart = new Date(start.toDateString());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const slotCount = await bookingRepository.countSlotBookings(serviceId, timeSlotId, dayStart, dayEnd);

      if (slotCount >= slot.maxBookings) {
        throw new ConflictError(
          `The "${slot.label}" time slot is already fully booked for ${start.toLocaleDateString('en-IN')}`
        );
      }
    }

    // ── Max Bookings Per Day ───────────────────────────────────────────────
    if (service.bookingMode !== 'time_slot' && service.maxBookingsPerDay) {
      const dayStart = new Date(start.toDateString());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayCount = await bookingRepository.countDayBookings(serviceId, dayStart, dayEnd);

      if (dayCount >= service.maxBookingsPerDay) {
        throw new ConflictError(
          `This service is fully booked for ${start.toLocaleDateString('en-IN')}. No more bookings are available on this date.`
        );
      }
    }

    // ── Guest / Seat Validations ───────────────────────────────────────────
    if (service.pricingUnit === 'per_person' && !guestCount) {
      throw new BadRequestError('Please specify the number of guests for this service');
    }
    if (guestCount && guestCount < 1) {
      throw new BadRequestError('Guest count must be at least 1');
    }
    if (guestCount && service.capacity && guestCount > service.capacity) {
      throw new ConflictError(
        `Guest count (${guestCount}) exceeds the maximum capacity of ${service.capacity}`
      );
    }

    // ── Pending Booking Guard ──────────────────────────────────────────────
    const existingPending = await bookingRepository.findExistingPending(
      user._id,
      serviceId,
      start,
      end,
      service.bookingMode === 'time_slot' ? timeSlotId : undefined
    );

    if (existingPending) {
      throw new ConflictError(
        'You already have a pending booking for this selection. Retry its payment instead.',
        { pendingBookingId: existingPending._id.toString() }
      );
    }

    // ── Duplicate Confirmed Booking Check ─────────────────────────────────
    const duplicate = await bookingRepository.findConfirmedDuplicate(user._id, serviceId, start, end);
    if (duplicate) {
      throw new ConflictError(
        'You already have an active booking for this service on the selected dates'
      );
    }

    // ── Calculate Price ───────────────────────────────────────────────────
    const totalDays = calculateTotalDays(start, end);
    const totalPrice = calculateTotalPrice(
      service.pricePerDay,
      service.pricingUnit || 'per_day',
      totalDays,
      totalHours,
      guestCount || 1
    );

    // ── Atomic Date Reservation (date_range mode only) ────────────────────
    if (service.bookingMode !== 'time_slot') {
      const reserved = await serviceRepository.atomicReserveDates(serviceId, start, end);
      if (!reserved) {
        throw new ConflictError(
          'Service is not available for the selected dates. It may have just been booked by someone else.'
        );
      }
    }

    // ── Create Booking Record ─────────────────────────────────────────────
    let booking: IBooking;
    try {
      booking = await bookingRepository.create({
        user: user._id,
        service: serviceId as unknown as IBooking['service'],
        startDate: start,
        endDate: end,
        totalDays,
        totalPrice,
        guestCount,
        notes,
        status: service.isFree ? 'confirmed' : 'pending',
        paymentStatus: service.isFree ? 'paid' : 'unpaid',
        ...(resolvedSlot && {
          timeSlotId: resolvedSlot._id,
          startTime: resolvedSlot.startTime,
          endTime: resolvedSlot.endTime,
          totalHours,
        }),
      });
    } catch (err) {
      if (service.bookingMode !== 'time_slot') {
        await serviceRepository.rollbackReservedDates(serviceId, start, end);
      }
      throw err;
    }

    // ── Stripe PaymentIntent ──────────────────────────────────────────────
    let clientSecret: string | null = null;
    if (!service.isFree) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalPrice * 100),
          currency: 'inr',
          metadata: { bookingId: booking._id.toString() },
        });
        clientSecret = paymentIntent.client_secret;
        booking.pendingStripePaymentIntentId = paymentIntent.id;
        await bookingRepository.save(booking);
      } catch {
        throw new ServiceUnavailableError(
          'Failed to initiate payment. You can retry from My Bookings.'
        );
      }
    } else {
      appEvents.emit('booking.created', {
        userName: user.name,
        userEmail: user.email,
        serviceName: service.title,
        startDate: start.toLocaleDateString('en-IN'),
        endDate: end.toLocaleDateString('en-IN'),
        totalDays,
        totalPrice,
        bookingId: booking._id.toString(),
        ...(resolvedSlot && {
          timeSlot: `${resolvedSlot.label} (${resolvedSlot.startTime} – ${resolvedSlot.endTime})`,
        }),
        ...(guestCount && { guestCount }),
      });
    }

    const populated = await bookingRepository.findByIdWithService(booking._id.toString());
    return { booking: populated!, clientSecret };
  }

  /**
   * Cancel a booking — issues a Stripe refund per cancellation policy.
   */
  async cancelBooking(
    user: IUser,
    bookingId: string,
    reason?: string
  ): Promise<{ refundIssued: boolean; refundAmount: number; message: string }> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.user.toString() !== user._id.toString()) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestError('Booking is already cancelled');
    }
    if (booking.status === 'completed') {
      throw new BadRequestError('Completed bookings cannot be cancelled');
    }

    const serviceDoc = await serviceRepository.findById(booking.service.toString());
    const policy = serviceDoc?.cancellationPolicy ?? 'Flexible';

    let refundAmount = 0;
    let refundIssued = false;

    if (booking.paymentStatus === 'paid' && booking.stripePaymentIntentId) {
      const daysToEvent = Math.ceil(
        (new Date(booking.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      let refundFraction = 0;
      if (policy === 'Flexible') {
        refundFraction = 1;
      } else if (policy === 'Moderate') {
        refundFraction = daysToEvent > 7 ? 1 : 0.5;
      }

      if (refundFraction > 0) {
        const alreadyRefunded = booking.refundAmount || 0;
        const refundable = booking.totalPrice - alreadyRefunded;
        refundAmount = Math.round(refundable * refundFraction * 100) / 100;

        if (refundAmount > 0) {
          try {
            const refund = await stripe.refunds.create({
              payment_intent: booking.stripePaymentIntentId,
              amount: Math.round(refundAmount * 100),
              reason: 'requested_by_customer',
              metadata: {
                bookingId,
                initiatedBy: 'customer',
                cancellationPolicy: policy,
                reason: reason?.trim() || '',
              },
            });

            booking.refundId = refund.id;
            booking.refundAmount = (booking.refundAmount || 0) + refundAmount;
            booking.refundReason = reason?.trim() || `Customer cancelled — ${policy} policy`;
            booking.refundStatus = refund.status as 'none' | 'pending' | 'succeeded' | 'failed';
            booking.refundedAt = new Date();
            booking.paymentStatus =
              booking.refundAmount >= booking.totalPrice ? 'refunded' : 'partially_refunded';
            refundIssued = true;
          } catch (err) {
            console.error('[BookingService] Stripe refund failed:', err);
          }
        }
      }
    }

    if (booking.paymentStatus === 'unpaid' && booking.pendingStripePaymentIntentId) {
      try {
        const intent = await stripe.paymentIntents.retrieve(booking.pendingStripePaymentIntentId);
        if (!['canceled', 'succeeded'].includes(intent.status)) {
          await stripe.paymentIntents.cancel(booking.pendingStripePaymentIntentId);
        }
        booking.pendingStripePaymentIntentId = undefined;
      } catch (err) {
        console.error('[BookingService] Failed to cancel PaymentIntent:', err);
      }
    }

    const previousStatus = booking.status;
    booking.status = 'cancelled';
    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push({
      fromStatus: previousStatus as BookingStatus,
      toStatus: 'cancelled',
      changedBy: user._id,
      actor: 'customer',
      reason: reason?.trim(),
      changedAt: new Date(),
    });
    await bookingRepository.save(booking);

    // Free the availability window
    if (serviceDoc && serviceDoc.bookingMode !== 'time_slot') {
      await serviceRepository.freeAvailabilityWindow(
        serviceDoc._id.toString(),
        booking.startDate,
        booking.endDate
      );
    }

    const serviceName = serviceDoc?.title || '';
    appEvents.emit('booking.cancelled', {
      userName: user.name,
      userEmail: user.email,
      serviceName,
      startDate: booking.startDate.toLocaleDateString('en-IN'),
      endDate: booking.endDate.toLocaleDateString('en-IN'),
      totalDays: booking.totalDays,
      totalPrice: booking.totalPrice,
      bookingId,
    });

    if (refundIssued) {
      appEvents.emit('booking.refunded', {
        userName: user.name,
        userEmail: user.email,
        serviceName,
        refundAmount,
        totalPrice: booking.totalPrice,
        isFullRefund: refundAmount >= booking.totalPrice,
        reason: reason?.trim() || 'Customer self-cancellation',
        bookingId,
      });
    }

    const message = refundIssued
      ? `Booking cancelled. A refund of ₹${refundAmount.toLocaleString('en-IN')} has been initiated.`
      : 'Booking cancelled successfully.';

    return { refundIssued, refundAmount, message };
  }

  /**
   * Admin: update booking status with lifecycle validation.
   */
  async adminUpdateStatus(
    adminUser: IUser,
    bookingId: string,
    dto: UpdateBookingStatusDto
  ): Promise<IBooking> {
    const { status, reason } = dto;

    const current = await bookingRepository.findById(bookingId);
    if (!current) throw new NotFoundError('Booking not found');
    if (current.status === status) {
      throw new BadRequestError(`Booking is already ${status}`);
    }

    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      pending: ['cancelled'],
      confirmed: ['completed', 'cancelled'],
      cancelled: [],
      completed: [],
    };

    if (!allowedTransitions[current.status].includes(status)) {
      throw new ConflictError(
        `Cannot change a ${current.status} booking to ${status}`,
        { allowedTransitions: allowedTransitions[current.status] }
      );
    }

    const trimmedReason = reason?.trim();
    if (status === 'cancelled' && !trimmedReason) {
      throw new BadRequestError('A cancellation reason is required for the audit record');
    }

    if (
      status === 'cancelled' &&
      current.paymentStatus !== 'unpaid' &&
      current.stripePaymentIntentId
    ) {
      throw new ConflictError('Refund this paid booking before cancelling it');
    }

    const updated = await bookingRepository.atomicStatusUpdate(
      bookingId,
      current.status,
      status,
      {
        fromStatus: current.status,
        toStatus: status,
        changedBy: adminUser._id,
        actor: 'admin',
        ...(trimmedReason && { reason: trimmedReason }),
        changedAt: new Date(),
      }
    );

    if (!updated) {
      throw new ConflictError(
        'Booking status changed by another request. Refresh and try again.'
      );
    }

    return updated;
  }

  /**
   * Get paginated bookings for the currently authenticated user.
   */
  async getMyBookings(
    user: IUser,
    query: GetMyBookingsQueryDto
  ): Promise<PaginatedResult<IBooking>> {
    const { status, type, page = '1', limit = '10' } = query;
    const filter: Record<string, unknown> = { user: user._id };

    if (type === 'cancelled') {
      filter.status = 'cancelled';
    } else if (type === 'upcoming') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      filter.endDate = { $gte: todayStart };
      if (!status) filter.status = { $in: ['confirmed', 'pending'] };
    } else if (type === 'past') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      filter.$or = [{ endDate: { $lt: todayStart } }, { status: 'completed' }];
      if (status) filter.status = status;
    } else if (status) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await bookingRepository.findByUser(filter, skip, limitNum);
    const totalPages = Math.ceil(total / limitNum);

    return {
      data,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Admin: get all bookings with pagination.
   */
  async getAllBookings(query: GetAllBookingsQueryDto): Promise<PaginatedResult<IBooking>> {
    const { page = '1', limit = '20', status } = query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await bookingRepository.findAll(filter, skip, limitNum);
    const totalPages = Math.ceil(total / limitNum);

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

  /**
   * Get a single booking — enforces owner/admin access control.
   */
  async getBookingById(user: IUser, bookingId: string): Promise<IBooking> {
    const booking = await bookingRepository.findByIdWithUserAndService(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const isOwner = (booking.user as unknown as { _id: { toString(): string } })._id.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) throw new ForbiddenError('Access denied');
    return booking;
  }
}

export default new BookingService();
