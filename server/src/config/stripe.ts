import Stripe from 'stripe';
import env from './env';

if (!env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY is missing in env');
}

const stripe: Stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2026-09-30.endive',
});

export default stripe;
