
import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils/stripeInit.js';

export const createPaymentSession = async (input: FieldResolveInput) => 
  resolverFor('Mutation','createPaymentSession', async ({ payload: { successUrl,
    cancelUrl, amount, currency } }) => {
    try {
      const session = await newStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: 'Payment',
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return session.url

    } catch (error) {
      throw new Error('Error creating payment intent: ' + JSON.stringify(error));
    }
  })(input.arguments);

  export default createPaymentSession;