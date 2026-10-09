import { Router } from 'express';
import { body } from 'express-validator';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getAvailableSlots,
} from '../controllers/serviceController';
import { protect, isAdmin } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', getServices);
router.get('/:id/available-slots', getAvailableSlots);
router.get('/:id', getServiceById);

// Admin-only routes
const serviceValidationRules = [
  body('title').optional().trim().notEmpty().withMessage('Title is required'),
  body('category')
    .optional()
    .isIn(['venue', 'hotel', 'caterer', 'cameraman', 'dj', 'decorator', 'other'])
    .withMessage('Invalid category'),
  body('description').optional().trim().notEmpty().withMessage('Description is required'),
  body('pricePerDay').optional().isNumeric().withMessage('Price per day must be a number'),
  body('availableFrom')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid start date format')
    .custom((value, { req }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(value) < today) {
        throw new Error('Start date cannot be in the past');
      }
      if (req.body.availableTo && !value) {
        throw new Error('Start date is required if end date is provided');
      }
      if (req.body.availableTo && new Date(value) > new Date(req.body.availableTo)) {
        throw new Error('Start date cannot be after end date');
      }
      return true;
    }),
  body('availableTo')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(value) < today) {
        throw new Error('End date cannot be in the past');
      }
      if (req.body.availableFrom && !value) {
         throw new Error('End date is required if start date is provided');
      }
      if (req.body.availableFrom) {
        const fromDate = new Date(req.body.availableFrom);
        const toDate = new Date(value);
        if (toDate < fromDate) {
          throw new Error('End date cannot be before start date');
        }
      }
      return true;
    }),
];

router.post(
  '/',
  protect,
  isAdmin,
  upload.array('images', 5),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category')
      .isIn(['venue', 'hotel', 'caterer', 'cameraman', 'dj', 'decorator', 'other'])
      .withMessage('Invalid category'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('pricePerDay').isNumeric().withMessage('Price per day must be a number'),
    body('availableFrom')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('availableTo')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Invalid end date format')
      .custom((value, { req }) => {
        if (req.body.availableFrom && new Date(value) < new Date(req.body.availableFrom)) {
          throw new Error('End date cannot be before start date');
        }
        return true;
      }),
  ],
  createService
);

router.put(
  '/:id',
  protect,
  isAdmin,
  upload.array('images', 5),
  serviceValidationRules,
  updateService
);

router.delete('/:id', protect, isAdmin, deleteService);

export default router;
