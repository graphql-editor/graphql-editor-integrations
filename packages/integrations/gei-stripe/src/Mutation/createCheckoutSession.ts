import { resolverFor } from '../zeus/index.js';
import { FieldResolveInput } from 'stucco-js';
import { universalCheckout } from '../utils/functions/universalCheckout.js';

export const createCheckoutSession = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'createCheckoutSession',
    async ({ payload: { successUrl, cancelUrl, products, applicationFee, username } }) => {
      return universalCheckout(successUrl, cancelUrl, products, applicationFee, username);
    },
  )(input.arguments, input.source);
export default createCheckoutSession;
