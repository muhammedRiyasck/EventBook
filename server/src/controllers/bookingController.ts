import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Booking from '../models/Booking';
import Service from '../models/Service';
import { AuthRequest } from '../middleware/auth';

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

    // ── Duplicate Booking Check ───────────────────────────────────────────────

    const duplicate = await Booking.findOne({
      user: req.user!._id,
      service: serviceId,
      status: { $nin: ['cancelled'] },
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

    let updatedService = service;

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

      updatedService = reserved;
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
        status: 'confirmed',
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

    // ── Emit booking.created event (non-blocking) ─────────────────────────────

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

    const populatedBooking = await Booking.findById(booking._id).populate(
      'service',
      'title category location pricePerDay images contact bookingMode pricingUnit'
    );

    res.status(201).json({
      success: true,
      data: populatedBooking,
      message: 'Booking confirmed! A confirmation email has been sent.',
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
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('service', 'title');

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};
