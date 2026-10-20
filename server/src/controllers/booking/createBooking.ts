import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Booking from '../../models/Booking';
import Service from '../../models/Service';
import { AuthRequest } from '../../middleware/auth';
import stripe from '../../config/stripe';
import appEvents from '../../utils/eventEmitter';
import {
  calculateTotalDays,
  calculateTotalHours,
  calculateTotalPrice,
} from '../../utils/priceCalculator';

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

    // Admins cannot create customer bookings
    if (req.user?.role === 'admin') {
      res.status(403).json({ success: false, message: 'Administrators cannot book services' });
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
      'title category location pricePerDay images contact bookingMode pricingUnit cancellationPolicy'
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
