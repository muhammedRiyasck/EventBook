import { Request, Response } from 'express';
import Stripe from 'stripe';
import stripe from '../config/stripe';
import env from '../config/env';
import Booking from '../models/Booking';
import appEvents from '../utils/eventEmitter';

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Must be raw body buffer
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed:`, err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the payment_intent.succeeded event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Retrieve booking ID from metadata
    const bookingId = paymentIntent.metadata?.bookingId;

    if (bookingId) {
      try {
        const booking = await Booking.findById(bookingId).populate('service');
        if (booking) {
          booking.paymentStatus = 'paid';
          booking.status = 'confirmed';
          await booking.save();

          // Emit booking.created to send the confirmation email
          appEvents.emit('booking.created', {
            userName: (booking.user as any)?.name || 'Customer',
            userEmail: (booking.user as any)?.email || 'customer@example.com',
            serviceName: (booking.service as any).title,
            startDate: booking.startDate.toLocaleDateString('en-IN'),
            endDate: booking.endDate.toLocaleDateString('en-IN'),
            totalDays: booking.totalDays,
            totalPrice: booking.totalPrice,
            bookingId: booking._id.toString(),
            ...(booking.timeSlotId && {
              timeSlot: `${booking.startTime} – ${booking.endTime}`,
            }),
            ...(booking.guestCount && { guestCount: booking.guestCount }),
          });
        }
      } catch (err) {
        console.error('Error updating booking after successful payment:', err);
      }
    }
  }

  // Handle payment failure — cancel the pending booking so the slot is freed
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = paymentIntent.metadata?.bookingId;

    if (bookingId) {
      try {
        const booking = await Booking.findById(bookingId);
        if (booking && booking.status === 'pending' && booking.paymentStatus === 'unpaid') {
          booking.status = 'cancelled';
          await booking.save();
          console.log(`Booking ${bookingId} cancelled due to payment failure`);
        }
      } catch (err) {
        console.error('Error cancelling booking after payment failure:', err);
      }
    }
  }

  res.status(200).json({ received: true });
};
