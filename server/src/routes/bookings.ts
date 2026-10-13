import { Router } from 'express';
import { body } from 'express-validator';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
  retryPayment,
  updateBookingStatus,
} from '../controllers/bookingController';
import { protect, isAdmin } from '../middleware/auth';

const router = Router();

// User routes
router.post(
  '/',
  protect,
  [
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes too long'),
    body('timeSlotId').optional().isString().withMessage('Invalid time slot ID'),
    body('guestCount')
      .optional()
      .isInt({ min: 1, max: 100000 })
      .withMessage('Guest count must be a positive number'),
  ],
  createBooking
);

router.get('/my', protect, getMyBookings);
router.post('/:id/retry-payment', protect, retryPayment);
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);

// Admin routes
router.get('/', protect, isAdmin, getAllBookings);
router.patch(
  '/:id/status',
  protect,
  isAdmin,
  [
    body('status')
      .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
      .withMessage('Invalid booking status'),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters'),
  ],
  updateBookingStatus
);

export default router;
