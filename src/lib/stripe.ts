import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-06-20',
  typescript: true,
});
