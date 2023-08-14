import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils/stripeInit.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'setDefaultPaymentMethod',
    async ({ payload: { customerId, attachedPaymentMethodId } }) => {
      const stripe = newStripe();

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: attachedPaymentMethodId,
        },
      });

      return true;
    },
  )(input.arguments, input.source);
