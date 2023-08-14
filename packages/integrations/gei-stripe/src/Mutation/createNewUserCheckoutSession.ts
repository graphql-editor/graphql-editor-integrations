import Stripe from 'stripe';
import { newStripe } from '../utils/stripeInit.js';
import { resolverFor } from '../zeus/index.js';
import { FieldResolveInput } from 'stucco-js';
import { universalCheckout } from '../utils/functions/universalCheckout.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'createNewUserCheckoutSession',
    async ({ payload: { successUrl, cancelUrl, products, applicationFee } }) => {
      return universalCheckout(successUrl, cancelUrl, products, applicationFee, null);
    },
  )(input.arguments, input.source);

