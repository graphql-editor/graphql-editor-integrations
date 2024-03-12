import Stripe from 'stripe';
import { resolverFor } from '../zeus/index.js';
import { FieldResolveInput } from 'stucco-js';

const stripe = new Stripe('YOUR_STRIPE_SECRET_KEY', {
  apiVersion: '2020-08-27',
});

export const createPayoutForConnectedAccount = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'createPayoutForConnectedAccount',
    async ({ payload: { accountId, amount, currency} }) => {
        try {
        const payout = await stripe.payouts.create({
            amount,
            currency,
            stripe_account: accountId,
          });
    
          if (payout) {
            return true;
          } else {
            return false;
          }
        } catch (error) {
            throw new Error('Error creating payout:' + JSON.stringify(error));
        }

    })(input.arguments, input.source)


