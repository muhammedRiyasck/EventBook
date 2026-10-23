import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { BadRequestError } from '../errors/AppError';
import bookingService from '../services/BookingService';
import { AuthRequest } from '../middleware/auth';
import paymentService from '../services/PaymentService';

/**
 * BookingController — thin HTTP adapter.
 * Validates, delegates to BookingService / PaymentService, formats response.
 */

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError(errors.array()[0].msg as string);

    const { booking, clientSecret } = await bookingService.createBooking(req.user!, req.body);
    const isFree = !clientSecret;
    res.status(201).json({
      success: true,
      data: booking,
      clientSecret,
      message: isFree ? 'Booking confirmed! A confirmation email has been sent.' : 'Proceeding to payment...',
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await bookingService.getMyBookings(req.user!, req.query as never);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await bookingService.getAllBookings(req.query as never);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const booking = await bookingService.getBookingById(req.user!, req.params.id as string);
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await bookingService.cancelBooking(req.user!, req.params.id as string, req.body.reason);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const retryPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await paymentService.retryPayment(req.user!._id.toString(), req.params.id as string);

    if (result.alreadyConfirmed) {
      res.status(200).json({ success: true, message: 'Your payment was already processed. Booking is now confirmed.', ...result });
      return;
    }
    if (result.processing) {
      res.status(202).json({ success: true, message: 'Your payment is being processed. Confirmation will follow shortly.', ...result });
      return;
    }
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError(errors.array()[0].msg as string);

    const booking = await bookingService.adminUpdateStatus(req.user!, req.params.id as string, req.body);
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};
