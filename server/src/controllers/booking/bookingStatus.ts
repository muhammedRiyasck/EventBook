import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Booking, { BookingStatus } from '../../models/Booking';
import Service from '../../models/Service';
import { AuthRequest } from '../../middleware/auth';
import stripe from '../../config/stripe';
import appEvents from '../../utils/eventEmitter';

/**
 * @desc    Cancel a booking (User — own booking only)
 *          If the booking was paid, issues a Stripe refund based on
 *          the service's cancellation policy:
 *            Flexible  → full refund always
 *            Moderate  → full refund if > 7 days to event; 50% otherwise
 *            Strict    → no refund
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private/User
 */
export const cancelBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reason } = req.body as { reason?: string };

    const booking = await Booking.findById(req.params.id).populate(
      'service',
      'title availability bookingMode cancellationPolicy'
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

    const serviceDoc = booking.service as unknown as {
      title: string;
      bookingMode: string;
      cancellationPolicy?: 'Flexible' | 'Moderate' | 'Strict';
      availability: Array<{ startDate: Date; endDate: Date; isBooked: boolean }>;
      _id: string;
    };

    // ── Stripe refund for paid bookings ──────────────────────────────────────
    let refundAmount = 0;
    let refundIssued = false;

    if (booking.paymentStatus === 'paid' && booking.stripePaymentIntentId) {
      const policy = serviceDoc.cancellationPolicy ?? 'Flexible';
      const daysToEvent = Math.ceil(
        (new Date(booking.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      let refundFraction = 0;
      if (policy === 'Flexible') {
        refundFraction = 1;
      } else if (policy === 'Moderate') {
        refundFraction = daysToEvent > 7 ? 1 : 0.5;
      } else {
        // Strict — no refund
        refundFraction = 0;
      }

      if (refundFraction > 0) {
        const alreadyRefunded = booking.refundAmount || 0;
        const refundable = booking.totalPrice - alreadyRefunded;
        refundAmount = Math.round(refundable * refundFraction * 100) / 100;

        if (refundAmount > 0) {
          try {
            const refund = await stripe.refunds.create({
              payment_intent: booking.stripePaymentIntentId,
              amount: Math.round(refundAmount * 100), // paise
              reason: 'requested_by_customer',
              metadata: {
                bookingId: booking._id.toString(),
                initiatedBy: 'customer',
                cancellationPolicy: policy,
                reason: reason?.trim() || '',
              },
            });

            booking.refundId = refund.id;
            booking.refundAmount = (booking.refundAmount || 0) + refundAmount;
            booking.refundReason = reason?.trim() || `Customer cancelled — ${policy} policy`;
            booking.refundStatus = refund.status as 'none' | 'pending' | 'succeeded' | 'failed';
            booking.refundedAt = new Date();
            booking.paymentStatus =
              booking.refundAmount >= booking.totalPrice ? 'refunded' : 'partially_refunded';
            refundIssued = true;
          } catch (stripeErr) {
            console.error('[CancelBooking] Stripe refund failed:', stripeErr);
            // Proceed with cancellation even if refund fails; admin can retry manually.
          }
        }
      }
    }

    // ── Cancel orphan PaymentIntent for unpaid pending bookings ───────────────
    if (booking.paymentStatus === 'unpaid' && booking.pendingStripePaymentIntentId) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          booking.pendingStripePaymentIntentId
        );
        if (!['canceled', 'succeeded'].includes(existingIntent.status)) {
          await stripe.paymentIntents.cancel(booking.pendingStripePaymentIntentId);
        }
        booking.pendingStripePaymentIntentId = undefined;
      } catch (stripeErr) {
        console.error('[CancelBooking] Failed to cancel Stripe PaymentIntent:', stripeErr);
      }
    }

    // ── Push status-history entry ─────────────────────────────────────────────
    const previousStatus = booking.status; // capture before mutation
    booking.status = 'cancelled';
    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push({
      fromStatus: previousStatus as 'pending' | 'confirmed' | 'cancelled' | 'completed',
      toStatus: 'cancelled',
      changedBy: req.user!._id,
      actor: 'customer',
      reason: reason?.trim(),
      changedAt: new Date(),
    });
    await booking.save();

    // ── Free up the availability window in the service (date_range mode only)
    const fullServiceDoc = await Service.findById(serviceDoc._id);
    if (fullServiceDoc && fullServiceDoc.bookingMode !== 'time_slot') {
      fullServiceDoc.availability = fullServiceDoc.availability.filter((window) => {
        const sameStart =
          new Date(window.startDate).getTime() === new Date(booking.startDate).getTime();
        const sameEnd =
          new Date(window.endDate).getTime() === new Date(booking.endDate).getTime();
        return !(sameStart && sameEnd && window.isBooked);
      });
      await fullServiceDoc.save();
    }

    const serviceName = serviceDoc?.title || '';

    // ── Emit events ───────────────────────────────────────────────────────────
    appEvents.emit('booking.cancelled', {
      userName: req.user!.name,
      userEmail: req.user!.email,
      serviceName,
      startDate: booking.startDate.toLocaleDateString('en-IN'),
      endDate: booking.endDate.toLocaleDateString('en-IN'),
      totalDays: booking.totalDays,
      totalPrice: booking.totalPrice,
      bookingId: booking._id.toString(),
    });

    if (refundIssued) {
      appEvents.emit('booking.refunded', {
        userName: req.user!.name,
        userEmail: req.user!.email,
        serviceName,
        refundAmount,
        totalPrice: booking.totalPrice,
        isFullRefund: refundAmount >= booking.totalPrice,
        reason: reason?.trim() || 'Customer self-cancellation',
        bookingId: booking._id.toString(),
      });
    }

    const message = refundIssued
      ? `Booking cancelled. A refund of ₹${refundAmount.toLocaleString('en-IN')} has been initiated.`
      : 'Booking cancelled successfully.';

    res.status(200).json({
      success: true,
      message,
      refundIssued,
      refundAmount: refundIssued ? refundAmount : 0,
    });
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { status, reason } = req.body as { status: BookingStatus; reason?: string };
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const currentBooking = await Booking.findById(req.params.id).select(
      'status paymentStatus stripePaymentIntentId'
    );

    if (!currentBooking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (currentBooking.status === status) {
      res.status(400).json({ success: false, message: `Booking is already ${status}` });
      return;
    }

    // A booking moves forward through a defined lifecycle. An admin must never
    // be able to revive cancelled/completed bookings or mark an unpaid payment attempt as confirmed.
    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      pending: ['cancelled'],
      confirmed: ['completed', 'cancelled'],
      cancelled: [],
      completed: [],
    };

    if (!allowedTransitions[currentBooking.status].includes(status)) {
      res.status(409).json({
        success: false,
        message: `Cannot change a ${currentBooking.status} booking to ${status}`,
        allowedTransitions: allowedTransitions[currentBooking.status],
      });
      return;
    }

    const trimmedReason = reason?.trim();
    if (status === 'cancelled' && !trimmedReason) {
      res.status(400).json({
        success: false,
        message: 'A cancellation reason is required for the audit record',
      });
      return;
    }

    // Stripe refunds are a financial operation, not a status edit. Requiring
    // the refund workflow prevents a paid booking from being silently cancelled
    // while the customer is still owed money.
    if (
      status === 'cancelled' &&
      currentBooking.paymentStatus !== 'unpaid' &&
      currentBooking.stripePaymentIntentId
    ) {
      res.status(409).json({
        success: false,
        message: 'Refund this paid booking before cancelling it',
      });
      return;
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: currentBooking._id, status: currentBooking.status },
      {
        $set: { status },
        $push: {
          statusHistory: {
            fromStatus: currentBooking.status,
            toStatus: status,
            changedBy: req.user!._id,
            actor: 'admin',
            ...(trimmedReason && { reason: trimmedReason }),
            changedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('service', 'title');

    if (!booking) {
      res.status(409).json({
        success: false,
        message: 'Booking status changed by another request. Refresh and try again.',
      });
      return;
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};
