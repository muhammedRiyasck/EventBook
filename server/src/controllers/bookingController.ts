import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Booking, { BookingStatus } from '../models/Booking';
import Service from '../models/Service';
import { AuthRequest } from '../middleware/auth';
import stripe from '../config/stripe';

import appEvents from '../utils/eventEmitter';
import {
  calculateTotalDays,
  calculateTotalHours,
  calculateTotalPrice,
} from '../utils/priceCalculator';

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private/User
 */
export const createBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { serviceId, startDate, endDate, notes, guestCount, timeSlotId } = req.body;

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      res.status(404).json({ success: false, message: 'Service not found or is currently unavailable' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // ── Date Validations ───────────────────────────────────────────────────────

    // Allow same-day bookings; reject only if end is before start
    if (start > end) {
      res.status(400).json({ success: false, message: 'End date cannot be before start date' });
      return;
    }

    // Compare against start of today (midnight) so today's date is never rejected
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);
    if (startDay < todayStart) {
      res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
      return;
    }

    // Check availability window set by admin
    if (service.availableFrom) {
      const availFrom = new Date(service.availableFrom);
      availFrom.setHours(0, 0, 0, 0);
      if (startDay < availFrom) {
        res.status(400).json({
          success: false,
          message: `This service is only available starting from ${availFrom.toLocaleDateString('en-IN')}`,
        });
        return;
      }
    }

    if (service.availableTo) {
      const availTo = new Date(service.availableTo);
      availTo.setHours(23, 59, 59, 999);
      const endDay = new Date(end);
      endDay.setHours(0, 0, 0, 0);
      if (endDay > availTo) {
        res.status(400).json({
          success: false,
          message: `This service is only available until ${availTo.toLocaleDateString('en-IN')}`,
        });
        return;
      }
    }

    // ── Time Slot Validations ─────────────────────────────────────────────────

    let resolvedSlot: { _id: string; label: string; startTime: string; endTime: string } | null = null;
    let totalHours = 0;

    if (service.bookingMode === 'time_slot') {
      if (!timeSlotId) {
        res.status(400).json({ success: false, message: 'Please select a time slot for this service' });
        return;
      }

      // Find and validate the requested slot
      const slot = service.timeSlots.find(
        (s) => s._id.toString() === timeSlotId && s.isActive
      );
      if (!slot) {
        res.status(400).json({ success: false, message: 'Invalid or unavailable time slot selected' });
        return;
      }

      resolvedSlot = {
        _id: slot._id.toString(),
        label: slot.label,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };

      totalHours = calculateTotalHours(slot.startTime, slot.endTime);

      // Check if this slot is already booked on the selected date (atomic via DB query)
      const slotBookingCount = await Booking.countDocuments({
        service: serviceId,
        timeSlotId: timeSlotId,
        startDate: {
          $gte: new Date(start.toDateString()),
          $lt: new Date(new Date(start.toDateString()).getTime() + 86400000),
        },
        status: { $nin: ['cancelled'] },
      });

      if (slotBookingCount >= slot.maxBookings) {
        res.status(409).json({
          success: false,
          message: `The "${slot.label}" time slot is already fully booked for ${start.toLocaleDateString('en-IN')}`,
        });
        return;
      }
    }

    // ── Max Bookings Per Day Check ────────────────────────────────────────────

    if (service.bookingMode !== 'time_slot' && service.maxBookingsPerDay) {
      const dayBookingCount = await Booking.countDocuments({
        service: serviceId,
        startDate: {
          $gte: new Date(start.toDateString()),
          $lt: new Date(new Date(start.toDateString()).getTime() + 86400000),
        },
        status: { $nin: ['cancelled'] },
      });

      if (dayBookingCount >= service.maxBookingsPerDay) {
        res.status(409).json({
          success: false,
          message: `This service is fully booked for ${start.toLocaleDateString('en-IN')}. No more bookings are available on this date.`,
        });
        return;
      }
    }

    // ── Guest / Seat Validations ──────────────────────────────────────────────

    if (service.pricingUnit === 'per_person' && !guestCount) {
      res.status(400).json({ success: false, message: 'Please specify the number of guests for this service' });
      return;
    }

    if (guestCount && guestCount < 1) {
      res.status(400).json({ success: false, message: 'Guest count must be at least 1' });
      return;
    }

    if (guestCount && service.capacity && guestCount > service.capacity) {
      res.status(400).json({
        success: false,
        message: `Guest count (${guestCount}) exceeds the maximum capacity of ${service.capacity}`,
      });
      return;
    }

    // Preserve a customer's unfinished payment rather than creating another
    // booking for the same service and selection. This check happens before
    // availability counters so the customer receives the actionable retry path.
    const existingPendingBooking = await Booking.findOne({
      user: req.user!._id,
      service: serviceId,
      status: 'pending',
      paymentStatus: 'unpaid',
      startDate: { $lte: end },
      endDate: { $gte: start },
      ...(service.bookingMode === 'time_slot' && { timeSlotId }),
    }).select('_id');

    if (existingPendingBooking) {
      res.status(409).json({
        success: false,
        message: 'You already have a pending booking for this selection. Retry its payment instead.',
        pendingBookingId: existingPendingBooking._id.toString(),
      });
      return;
    }

    // ── Duplicate Booking Check ───────────────────────────────────────────────
    // Only block if there's already a confirmed/completed booking on these dates
    const duplicate = await Booking.findOne({
      user: req.user!._id,
      service: serviceId,
      status: { $in: ['confirmed', 'completed'] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    if (duplicate) {
      res.status(409).json({
        success: false,
        message: 'You already have an active booking for this service on the selected dates',
      });
      return;
    }

    // ── Calculate Price ───────────────────────────────────────────────────────

    const totalDays = calculateTotalDays(start, end);
    const totalPrice = calculateTotalPrice(
      service.pricePerDay,
      service.pricingUnit || 'per_day',
      totalDays,
      totalHours,
      guestCount || 1
    );

    // ── Atomic Reservation (date-range mode) ─────────────────────────────────

    if (service.bookingMode !== 'time_slot') {
      // Atomically check and reserve dates to prevent race conditions
      const reserved = await Service.findOneAndUpdate(
        {
          _id: serviceId,
          isActive: true,
          availability: {
            $not: {
              $elemMatch: {
                isBooked: true,
                startDate: { $lt: end },
                endDate: { $gt: start },
              },
            },
          },
        },
        {
          $push: {
            availability: {
              startDate: start,
              endDate: end,
              isBooked: true,
            },
          },
        },
        { new: true }
      );

      if (!reserved) {
        res.status(409).json({
          success: false,
          message: 'Service is not available for the selected dates. It may have just been booked by someone else.',
        });
        return;
      }
    }

    // ── Create Booking Record ────────────────────────────────────────────────

    let booking;
    try {
      booking = await Booking.create({
        user: req.user!._id,
        service: serviceId,
        startDate: start,
        endDate: end,
        totalDays,
        totalPrice,
        guestCount,
        notes,
        status: service.isFree ? 'confirmed' : 'pending',
        paymentStatus: service.isFree ? 'paid' : 'unpaid',
        // time slot fields
        ...(resolvedSlot && {
          timeSlotId: resolvedSlot._id,
          startTime: resolvedSlot.startTime,
          endTime: resolvedSlot.endTime,
          totalHours,
        }),
      });
    } catch (err) {
      // Rollback the date reservation if booking creation fails
      if (service.bookingMode !== 'time_slot') {
        await Service.findByIdAndUpdate(serviceId, {
          $pull: {
            availability: {
              startDate: start,
              endDate: end,
              isBooked: true,
            },
          },
        });
      }
      throw err;
    }

    // ── Stripe Payment Intent ───────────────────────────────────────────────
    let clientSecret: string | null = null;
    if (!service.isFree) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalPrice * 100), // Stripe expects amounts in smallest unit (paise)
          currency: 'inr',
          metadata: {
            bookingId: booking._id.toString(),
          },
        });
        clientSecret = paymentIntent.client_secret;
        booking.pendingStripePaymentIntentId = paymentIntent.id;
        await booking.save();
      } catch (err) {
        console.error('Failed to create Stripe payment intent:', err);
        // Preserve the pending booking so it can be retried rather than lost.
        res.status(503).json({ success: false, message: 'Failed to initiate payment. You can retry from My Bookings.' });
        return;
      }
    } else {
      // Emit booking.created event immediately since it's a free service and confirmed
      appEvents.emit('booking.created', {
        userName: req.user!.name,
        userEmail: req.user!.email,
        serviceName: service.title,
        startDate: start.toLocaleDateString('en-IN'),
        endDate: end.toLocaleDateString('en-IN'),
        totalDays,
        totalPrice,
        bookingId: (booking._id?.toString() as string).toString(),
        // optional enrichments for email
        ...(resolvedSlot && {
          timeSlot: `${resolvedSlot.label} (${resolvedSlot.startTime} – ${resolvedSlot.endTime})`,
        }),
        ...(guestCount && { guestCount }),
      });
    }

    const populatedBooking = await Booking.findById(booking._id).populate(
      'service',
      'title category location pricePerDay images contact bookingMode pricingUnit'
    );

    res.status(201).json({
      success: true,
      data: populatedBooking,
      clientSecret, // Used by frontend Elements
      message: service.isFree ? 'Booking confirmed! A confirmation email has been sent.' : 'Proceeding to payment...',
    });
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Get current user's bookings (past + upcoming)
 * @route   GET /api/bookings/my
 * @access  Private/User
 */
export const getMyBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, type } = req.query as { status?: string; type?: string };
    const query: Record<string, unknown> = { user: req.user!._id };

    if (status) query.status = status;

    // Filter upcoming vs past
    if (type === 'upcoming') {
      query.startDate = { $gte: new Date() };
    } else if (type === 'past') {
      query.startDate = { $lt: new Date() };
    }

    const bookings = await Booking.find(query)
      .populate('service', 'title category location pricePerDay images contact bookingMode pricingUnit')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings (Admin only)
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
export const getAllBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '20', status } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('service', 'title category location pricePerDay bookingMode pricingUnit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
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
 * @desc    Create or resume payment for an existing pending booking
 * @route   POST /api/bookings/:id/retry-payment
 * @access  Private/User
 */
export const retryPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.user.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'You can only retry payment for your own booking' });
      return;
    }

    if (booking.status !== 'pending' || booking.paymentStatus !== 'unpaid') {
      res.status(400).json({ success: false, message: 'Only pending unpaid bookings can be paid again' });
      return;
    }

    const service = await Service.findById(booking.service).select('isActive isFree');
    if (!service || !service.isActive || service.isFree) {
      res.status(409).json({ success: false, message: 'This booking is no longer eligible for payment' });
      return;
    }

    // Reuse an untouched PaymentIntent where possible. This avoids creating
    // more than one charge opportunity for a single pending booking.
    if (booking.pendingStripePaymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(booking.pendingStripePaymentIntentId);

      if (existingIntent.status === 'succeeded' || existingIntent.status === 'processing') {
        res.status(409).json({
          success: false,
          message: 'Payment is already being verified. Please wait for booking confirmation.',
        });
        return;
      }

      if (existingIntent.status === 'requires_payment_method' && existingIntent.client_secret) {
        res.status(200).json({
          success: true,
          data: booking,
          clientSecret: existingIntent.client_secret,
        });
        return;
      }

      if (existingIntent.status !== 'canceled') {
        await stripe.paymentIntents.cancel(existingIntent.id);
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100),
      currency: 'inr',
      metadata: { bookingId: booking._id.toString() },
    });

    if (!paymentIntent.client_secret) {
      res.status(502).json({ success: false, message: 'Could not prepare a payment session. Please try again.' });
      return;
    }

    booking.pendingStripePaymentIntentId = paymentIntent.id;
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private (owner or admin)
 */
export const getBookingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('service', 'title category location pricePerDay images contact bookingMode pricingUnit timeSlots');

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Only owner or admin can view
    const isOwner = booking.user._id.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Cancel a booking (User — own booking only)
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private/User
 */
export const cancelBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      'service',
      'title availability bookingMode'
    );

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Only the booking owner can cancel
    if (booking.user.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'You can only cancel your own bookings' });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({ success: false, message: 'Booking is already cancelled' });
      return;
    }

    if (booking.status === 'completed') {
      res.status(400).json({ success: false, message: 'Completed bookings cannot be cancelled' });
      return;
    }

    booking.status = 'cancelled';
    await booking.save();

    // Free up the availability window in the service (date_range mode only)
    const serviceDoc = await Service.findById(booking.service);
    if (serviceDoc && serviceDoc.bookingMode !== 'time_slot') {
      serviceDoc.availability = serviceDoc.availability.filter((window) => {
        const sameStart = new Date(window.startDate).getTime() === new Date(booking.startDate).getTime();
        const sameEnd = new Date(window.endDate).getTime() === new Date(booking.endDate).getTime();
        return !(sameStart && sameEnd && window.isBooked);
      });
      await serviceDoc.save();
    }

    // Emit booking.cancelled event (non-blocking)
    appEvents.emit('booking.cancelled', {
      userName: req.user!.name,
      userEmail: req.user!.email,
      serviceName: (booking.service as unknown as { title: string })?.title || '',
      startDate: booking.startDate.toLocaleDateString('en-IN'),
      endDate: booking.endDate.toLocaleDateString('en-IN'),
      totalDays: booking.totalDays,
      totalPrice: booking.totalPrice,
      bookingId: (booking._id?.toString() as string).toString(),
    });

    res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update booking status (Admin only)
 * @route   PATCH /api/bookings/:id/status
 * @access  Private/Admin
 */
export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { status, reason } = req.body as { status: BookingStatus; reason?: string };
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const currentBooking = await Booking.findById(req.params.id).select(
      'status paymentStatus stripePaymentIntentId'
    );

    if (!currentBooking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (currentBooking.status === status) {
      res.status(400).json({ success: false, message: `Booking is already ${status}` });
      return;
    }

    // A booking moves forward through a defined lifecycle.  In particular, an
    // admin must never be able to revive cancelled/completed bookings or mark
    // an unpaid payment attempt as confirmed.
    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      pending: ['cancelled'],
      confirmed: ['completed', 'cancelled'],
      cancelled: [],
      completed: [],
    };

    if (!allowedTransitions[currentBooking.status].includes(status)) {
      res.status(409).json({
        success: false,
        message: `Cannot change a ${currentBooking.status} booking to ${status}`,
        allowedTransitions: allowedTransitions[currentBooking.status],
      });
      return;
    }

    const trimmedReason = reason?.trim();
    if (status === 'cancelled' && !trimmedReason) {
      res.status(400).json({
        success: false,
        message: 'A cancellation reason is required for the audit record',
      });
      return;
    }

    // Stripe refunds are a financial operation, not a status edit.  Requiring
    // the refund workflow prevents a paid booking from being silently cancelled
    // while the customer is still owed money.
    if (
      status === 'cancelled' &&
      currentBooking.paymentStatus !== 'unpaid' &&
      currentBooking.stripePaymentIntentId
    ) {
      res.status(409).json({
        success: false,
        message: 'Refund this paid booking before cancelling it',
      });
      return;
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: currentBooking._id, status: currentBooking.status },
      {
        $set: { status },
        $push: {
          statusHistory: {
            fromStatus: currentBooking.status,
            toStatus: status,
            changedBy: req.user!._id,
            actor: 'admin',
            ...(trimmedReason && { reason: trimmedReason }),
            changedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('service', 'title');

    if (!booking) {
      res.status(409).json({
        success: false,
        message: 'Booking status changed by another request. Refresh and try again.',
      });
      return;
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};
