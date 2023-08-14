import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils/stripeInit.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'createConnectAccount',
    async ({ payload: { type, country, email, bankAccount, business_type } }) => {
      const stripe = newStripe();

      const account = await stripe.accounts.create({
        type: type,
        country,
        email,
        business_type,
      });

      const accountToken = await stripe.tokens.create({
        bank_account: {
          country,
          currency: bankAccount.currency,
          account_holder_name: bankAccount.account_holder_name,
          account_holder_type: bankAccount.account_holder_type,
          account_number: bankAccount.account_number,
        },
      });

      const stripeBankAccount = await stripe.accounts.createExternalAccount(account.id, {
        external_account: accountToken.id,
      });

      return true;
    },
  )(input.arguments, input.source);
