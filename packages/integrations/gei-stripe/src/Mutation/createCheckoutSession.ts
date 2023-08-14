import Stripe from 'stripe';
import { newStripe } from '../utils/stripeInit.js';
import { resolverFor } from '../zeus/index.js';
import { FieldResolveInput } from 'stucco-js';
import { MongoOrb } from '../db/orm.js';
import { WithId } from 'mongodb';
import { universalCheckout } from '../utils/functions/universalCheckout.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'createCheckoutSession',
    async ({ payload: { successUrl, cancelUrl, products, applicationFee, username } }) => {
      return universalCheckout(successUrl, cancelUrl, products, applicationFee, username);
    },
  )(input.arguments, input.source);
