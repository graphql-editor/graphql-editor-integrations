import { newStripe } from "../utils/stripeInit.js";
import { resolverFor } from '../zeus/index.js';
import { FieldResolveInput } from 'stucco-js';



export const createPayoutForConnectedAccount = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'createPayoutForConnectedAccount',
    async ({ payload: { accountId, amount, currency } }) => {
        try {
        const stripe_account = process.env.STRIPE_ACCOUNT_ID || accountId
        if (!stripe_account) throw new Error('missing accountId');
        const payout = await newStripe().payouts.create({
            amount,
            currency,
            destination: stripe_account,
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

export default createPayoutForConnectedAccount;


