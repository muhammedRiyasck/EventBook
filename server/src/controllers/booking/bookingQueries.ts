import { Response, NextFunction } from 'express';
import Booking from '../../models/Booking';
import { AuthRequest } from '../../middleware/auth';

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
    const { status, type, page = '1', limit = '10' } = req.query as {
      status?: string;
      type?: string;
      page?: string;
      limit?: string;
    };
    const query: Record<string, unknown> = { user: req.user!._id };

    if (status) {
      query.status = status;
    }

    // Filter by tab type:
    //  - 'cancelled': all cancelled bookings
    //  - 'upcoming': active upcoming bookings (endDate >= today midnight, confirmed or pending)
    //  - 'past': all past bookings (endDate < today midnight OR status is 'completed', including past cancelled/refunded events)
    //  - 'all' or empty: all bookings for this user
    if (type === 'cancelled') {
      query.status = 'cancelled';
    } else if (type === 'upcoming') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      query.endDate = { $gte: todayStart };
      if (!status) {
        query.status = { $in: ['confirmed', 'pending'] };
      }
    } else if (type === 'past') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (status) {
        query.status = status;
        query.$or = [{ endDate: { $lt: todayStart } }, { status: 'completed' }];
      } else {
        query.$or = [{ endDate: { $lt: todayStart } }, { status: 'completed' }];
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('service', 'title category location pricePerDay images contact bookingMode pricingUnit cancellationPolicy')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
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
        .populate('service', 'title category location pricePerDay bookingMode pricingUnit cancellationPolicy')
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
      .populate('service', 'title category location pricePerDay images contact bookingMode pricingUnit timeSlots cancellationPolicy');

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
