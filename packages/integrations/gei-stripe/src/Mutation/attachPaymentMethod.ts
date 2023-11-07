import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils/stripeInit.js';

export const attachPaymentMethod = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'attachPaymentMethod', async ({ payload: { customerId, paymentMethodId } }) => {
    const stripe = newStripe();

    const attachedPaymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return true;
  })(input.arguments, input.source);
export default attachPaymentMethod;
