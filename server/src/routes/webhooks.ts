import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController';

const router = express.Router();

// The Stripe webhook endpoint needs the raw body buffer to verify the signature
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router;
