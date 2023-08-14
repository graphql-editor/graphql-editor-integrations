import Stripe from "stripe";

export const newStripe = (stripeKey = process.env.STRIPE_KEY) => {
    if (!stripeKey) throw new Error('missing stripe key');
    return new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
    });
  };