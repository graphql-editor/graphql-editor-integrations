import { newStripe } from "../utils/stripeInit.js";
import { resolverFor } from '../zeus/index.js';
import { FieldResolveInput } from 'stucco-js';



export const createPayoutForConnectedAccount = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'createPayoutForConnectedAccount',
    async ({ payload: { accountId, amount, currency } }) => {
        try {
        const payout = await newStripe().payouts.create({
            amount,
            currency,
            destination: accountId || undefined,
            source_type: 'bank_account',
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


