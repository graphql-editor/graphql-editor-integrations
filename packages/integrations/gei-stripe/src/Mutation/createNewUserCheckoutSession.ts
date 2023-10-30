import { resolverFor } from '../zeus/index.js';
import { FieldResolveInput } from 'stucco-js';
import { universalCheckout } from '../utils/functions/universalCheckout.js';

export const createNewUserCheckoutSession = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'createNewUserCheckoutSession',
    async ({ payload: { successUrl, cancelUrl, products, applicationFee } }) => {
      return universalCheckout(successUrl, cancelUrl, products, applicationFee, null);
    },
  )(input.arguments, input.source);
export default createNewUserCheckoutSession;
