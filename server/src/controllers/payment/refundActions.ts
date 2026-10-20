import { Response, NextFunction } from 'express';
import Booking from '../../models/Booking';
import stripe from '../../config/stripe';
import { AuthRequest } from '../../middleware/auth';
import appEvents from '../../utils/eventEmitter';

/**
 * @desc    Issue a full or partial refund via Stripe
 * @route   POST /api/payments/transactions/:id/refund
 * @access  Private/Admin
 */
export const issueRefund = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount, reason } = req.body as { amount?: number; reason?: string };

    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('service', 'title');

    if (!booking) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    if (!booking.stripePaymentIntentId) {
      res.status(400).json({ success: false, message: 'No Stripe payment associated with this booking' });
      return;
    }

    if (booking.paymentStatus === 'unpaid') {
      res.status(400).json({ success: false, message: 'Cannot refund an unpaid booking' });
      return;
    }

    if (booking.paymentStatus === 'refunded') {
      res.status(400).json({ success: false, message: 'This booking has already been fully refunded' });
      return;
    }

    const maxRefundable = booking.totalPrice - (booking.refundAmount || 0);
    const refundRupees = amount ? Math.min(amount, maxRefundable) : maxRefundable;

    if (refundRupees <= 0) {
      res.status(400).json({ success: false, message: 'No refundable amount remaining' });
      return;
    }

    const refundAmountPaise = Math.round(refundRupees * 100);

    let refund;
    try {
      refund = await stripe.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
        amount: refundAmountPaise,
        reason: 'requested_by_customer',
        metadata: {
          bookingId: booking._id.toString(),
          adminReason: reason || '',
        },
      });
    } catch (stripeErr: unknown) {
      const msg = stripeErr instanceof Error ? stripeErr.message : 'Stripe refund failed';
      res.status(400).json({ success: false, message: msg });
      return;
    }

    const isFullRefund = refundRupees >= booking.totalPrice;
    booking.refundId = refund.id;
    booking.refundAmount = (booking.refundAmount || 0) + refundRupees;
    booking.refundReason = reason || '';
    booking.refundStatus = refund.status as 'none' | 'pending' | 'succeeded' | 'failed';
    booking.refundedAt = new Date();
    booking.paymentStatus = isFullRefund ? 'refunded' : 'partially_refunded';
    if (isFullRefund) {
      booking.status = 'cancelled';
    }
    await booking.save();

    const user = booking.user as unknown as { name: string; email: string };
    const service = booking.service as unknown as { title: string };

    appEvents.emit('booking.refunded', {
      userName: user.name,
      userEmail: user.email,
      serviceName: service.title,
      refundAmount: refundRupees,
      totalPrice: booking.totalPrice,
      isFullRefund,
      reason: reason || 'No reason provided',
      bookingId: booking._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: `Refund of ₹${refundRupees.toLocaleString('en-IN')} issued successfully`,
      data: booking,
      refund: {
        id: refund.id,
        amount: refundRupees,
        status: refund.status,
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message: string };
      res.status(400).json({ success: false, message: stripeError.message || 'Stripe refund failed' });
      return;
    }
    next(error);
  }
};
