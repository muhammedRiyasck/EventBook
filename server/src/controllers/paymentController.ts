import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { BadRequestError } from '../errors/AppError';
import adminPaymentService from '../services/AdminPaymentService';
import { AuthRequest } from '../middleware/auth';

/**
 * PaymentController —  HTTP adapter for payment/transaction admin routes.
 */

export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminPaymentService.getTransactions(req.query as never);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { booking, stripeDetails } = await adminPaymentService.getTransactionById(req.params.id as string);
    res.status(200).json({ success: true, data: booking, stripeDetails });
  } catch (error) {
    next(error);
  }
};

export const getRevenueSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminPaymentService.getRevenueSummary(req.query.period as string);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getRefunds = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, status } = req.query as Record<string, string>;
    const result = await adminPaymentService.getRefunds(page, limit, status);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const issueRefund = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError(errors.array()[0].msg as string);

    const { amount, reason } = req.body as { amount?: number; reason?: string };
    const { booking, refund } = await adminPaymentService.issueAdminRefund(req.params.id as string, amount, reason);

    res.status(200).json({
      success: true,
      message: `Refund of ₹${refund.amount.toLocaleString('en-IN')} issued successfully`,
      data: booking,
      refund,
    });
  } catch (error) {
    // Surface Stripe errors cleanly
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeErr = error as unknown as { message?: string };
      res.status(400).json({ success: false, message: stripeErr.message || 'Stripe refund failed' });
      return;
    }
    next(error);
  }
};
