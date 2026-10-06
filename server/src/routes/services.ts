import { Router } from 'express';
import { body } from 'express-validator';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../controllers/serviceController';
import { protect, isAdmin } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', getServices);
router.get('/:id', getServiceById);

// Admin-only routes
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
  ],
  createService
);

router.put('/:id', protect, isAdmin, upload.array('images', 5), updateService);

router.delete('/:id', protect, isAdmin, deleteService);

export default router;
