import { Request, Response } from 'express';
import Stripe from 'stripe';
import stripe from '../config/stripe';
import env from '../config/env';
import paymentService from '../services/PaymentService';

/**
 * WebhookController — thin adapter for Stripe webhook events.
 * Signature verification stays here (HTTP concern); event handling delegates to PaymentService.
 */
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('⚠️  Webhook signature verification failed:', msg);
    res.status(400).send(`Webhook Error: ${msg}`);
    return;
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.bookingId;
      if (bookingId) {
        await paymentService.handlePaymentSuccess(paymentIntent.id, bookingId);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.bookingId;
      if (bookingId) {
        await paymentService.handlePaymentFailure(bookingId);
      }
    }
  } catch (err) {
    console.error('Error processing webhook event:', err);
    res.status(500).json({ received: false });
    return;
  }

  res.status(200).json({ received: true });
};
