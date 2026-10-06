import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Booking from '../models/Booking';
import Service from '../models/Service';
import { AuthRequest } from '../middleware/auth';
import {
  calculateTotalDays,
  calculateTotalPrice,
  hasAvailabilityConflict,
} from '../utils/priceCalculator';
import {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
} from '../utils/emailService';

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

    const { serviceId, startDate, endDate, notes } = req.body;

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start >= end) {
      res.status(400).json({ success: false, message: 'End date must be after start date' });
      return;
    }

    if (start < new Date()) {
      res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
      return;
    }

    // Check for availability conflicts
    const conflict = hasAvailabilityConflict(service.availability, start, end);
    if (conflict) {
      res.status(409).json({
        success: false,
        message: 'Service is not available for the selected dates',
      });
      return;
    }

    const totalDays = calculateTotalDays(start, end);
    const totalPrice = calculateTotalPrice(service.pricePerDay, totalDays);

    // Create the booking
    const booking = await Booking.create({
      user: req.user!._id,
      service: serviceId,
      startDate: start,
      endDate: end,
      totalDays,
      totalPrice,
      notes,
      status: 'confirmed',
    });

    // Mark the dates as booked in the service availability
    service.availability.push({
      startDate: start,
      endDate: end,
      isBooked: true,
    });
    await service.save();

    // Send confirmation email (non-blocking — don't fail the request if email fails)
    sendBookingConfirmationEmail({
      userName: req.user!.name,
      userEmail: req.user!.email,
      serviceName: service.title,
      startDate: start.toLocaleDateString('en-IN'),
      endDate: end.toLocaleDateString('en-IN'),
      totalDays,
      totalPrice,
      bookingId: (booking._id?.toString() as string).toString(),
    }).catch((err) => console.error('Email send failed:', err));

    const populatedBooking = await Booking.findById(booking._id).populate(
      'service',
      'title category location pricePerDay images contact'
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
      .populate('service', 'title category location pricePerDay images contact')
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
        .populate('service', 'title category location pricePerDay')
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
      .populate('service', 'title category location pricePerDay images contact');

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
      'title availability'
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

    // Free up the availability window in the service
    const service = await Service.findById(booking.service);
    if (service) {
      service.availability = service.availability.filter((window) => {
        const sameStart = new Date(window.startDate).getTime() === new Date(booking.startDate).getTime();
        const sameEnd = new Date(window.endDate).getTime() === new Date(booking.endDate).getTime();
        return !(sameStart && sameEnd && window.isBooked);
      });
      await service.save();
    }

    // Send cancellation email (non-blocking)
    sendBookingCancellationEmail({
      userName: req.user!.name,
      userEmail: req.user!.email,
      serviceName: (booking.service as unknown as { title: string })?.title || '',
      startDate: booking.startDate.toLocaleDateString('en-IN'),
      endDate: booking.endDate.toLocaleDateString('en-IN'),
      totalDays: booking.totalDays,
      totalPrice: booking.totalPrice,
      bookingId: (booking._id?.toString() as string).toString(),
    }).catch((err) => console.error('Cancellation email failed:', err));

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
