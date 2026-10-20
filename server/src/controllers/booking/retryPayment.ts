import { Response, NextFunction } from 'express';
import Booking from '../../models/Booking';
import Service from '../../models/Service';
import { AuthRequest } from '../../middleware/auth';
import stripe from '../../config/stripe';
import appEvents from '../../utils/eventEmitter';

/**
 * @desc    Create or resume payment for an existing pending booking
 * @route   POST /api/bookings/:id/retry-payment
 * @access  Private/User
 */
export const retryPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.user.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'You can only retry payment for your own booking' });
      return;
    }

    if (booking.status !== 'pending' || booking.paymentStatus !== 'unpaid') {
      res.status(400).json({ success: false, message: 'Only pending unpaid bookings can be paid again' });
      return;
    }

    const service = await Service.findById(booking.service).select('isActive isFree');
    if (!service || !service.isActive || service.isFree) {
      res.status(409).json({ success: false, message: 'This booking is no longer eligible for payment' });
      return;
    }

    // Reuse an untouched PaymentIntent where possible. This avoids creating
    // more than one charge opportunity for a single pending booking.
    if (booking.pendingStripePaymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(booking.pendingStripePaymentIntentId);

      // The PaymentIntent already succeeded but the webhook never updated the
      // booking (e.g. webhook delivery failure or server crash). Stripe has
      // already collected the money — confirm the booking now using the same
      // atomic update the webhook would have applied. The findOneAndUpdate
      // filter ensures this is idempotent if the webhook also arrives later.
      if (existingIntent.status === 'succeeded') {
        const confirmedBooking = await Booking.findOneAndUpdate(
          { _id: booking._id, paymentStatus: 'unpaid', status: 'pending' },
          {
            $set: {
              paymentStatus: 'paid',
              status: 'confirmed',
              stripePaymentIntentId: existingIntent.id,
            },
            $unset: { pendingStripePaymentIntentId: 1 },
          },
          { new: true }
        )
          .populate('user', 'name email')
          .populate('service', 'title');

        if (confirmedBooking) {
          appEvents.emit('booking.created', {
            userName: (confirmedBooking.user as unknown as { name?: string })?.name || 'Customer',
            userEmail: (confirmedBooking.user as unknown as { email?: string })?.email || 'customer@example.com',
            serviceName: (confirmedBooking.service as unknown as { title?: string })?.title || 'Service',
            startDate: confirmedBooking.startDate.toLocaleDateString('en-IN'),
            endDate: confirmedBooking.endDate.toLocaleDateString('en-IN'),
            totalDays: confirmedBooking.totalDays,
            totalPrice: confirmedBooking.totalPrice,
            bookingId: confirmedBooking._id.toString(),
            ...(confirmedBooking.timeSlotId && {
              timeSlot: `${confirmedBooking.startTime} – ${confirmedBooking.endTime}`,
            }),
            ...(confirmedBooking.guestCount && { guestCount: confirmedBooking.guestCount }),
          });
        }

        res.status(200).json({
          success: true,
          message: 'Your payment was already processed. Booking is now confirmed.',
          data: confirmedBooking ?? booking,
          alreadyConfirmed: true,
        });
        return;
      }

      // Still processing — Stripe hasn't settled yet; webhook should fire
      // shortly. Nothing for us to do — just tell the user to wait.
      if (existingIntent.status === 'processing') {
        res.status(202).json({
          success: true,
          message: 'Your payment is being processed. Booking confirmation will follow shortly.',
          data: booking,
          processing: true,
        });
        return;
      }

      if (existingIntent.status === 'requires_payment_method' && existingIntent.client_secret) {
        res.status(200).json({
          success: true,
          data: booking,
          clientSecret: existingIntent.client_secret,
        });
        return;
      }

      if (existingIntent.status !== 'canceled') {
        await stripe.paymentIntents.cancel(existingIntent.id);
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100),
      currency: 'inr',
      metadata: { bookingId: booking._id.toString() },
    });

    if (!paymentIntent.client_secret) {
      res.status(502).json({ success: false, message: 'Could not prepare a payment session. Please try again.' });
      return;
    }

    booking.pendingStripePaymentIntentId = paymentIntent.id;
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    next(error);
  }
};
