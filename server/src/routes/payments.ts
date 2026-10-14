import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTransactions,
  getTransactionById,
  getRevenueSummary,
  issueRefund,
  getRefunds,
} from '../controllers/paymentController';
import { protect, isAdmin } from '../middleware/auth';

const router = Router();

router.use(protect, isAdmin);

router.get('/summary', getRevenueSummary);

router.get('/refunds', getRefunds);

router.get('/transactions', getTransactions);

router.get('/transactions/:id', getTransactionById);

router.post(
  '/transactions/:id/refund',
  [
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Refund amount must be positive'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters'),
  ],
  issueRefund
);

export default router;
