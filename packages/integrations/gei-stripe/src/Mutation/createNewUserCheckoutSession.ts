import Stripe from 'stripe';
import { newStripe } from '../utils/stripeInit.js';
import { resolverFor } from '../zeus/index.js';
import { FieldResolveInput } from 'stucco-js';
type item = {
  price: string;
  quantity?: number;
};
export const handler = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'createNewUserCheckoutSession',
    async ({ payload: { successUrl, cancelUrl, products, applicationFee } }) => {
      const stripe = newStripe();
      const subscriptionItems: item[] = [];
      const oneTimePaymentItems: item[] = [];

      let totalAmount = 0;

      await Promise.all(
        products.map(async (product) => {
          let price;
          if (product.productId.startsWith('price_')) {
            price = await stripe.prices.retrieve(product.productId);
          } else if (product.productId.startsWith('prod_')) {
            const { default_price } = await stripe.products.retrieve(product.productId);
            if (!default_price) {
              throw new Error('Cannot find product ' + product.productId + ' default price');
            }
            price =
              typeof default_price === 'string'
                ? await stripe.prices.retrieve(default_price)
                : await stripe.prices.retrieve(default_price.id);
          } else {
            throw new Error('Invalid product ID: ' + product.productId);
          }

          const quantity = price.type === 'recurring' || price.recurring?.usage_type === 'metered' ? 1 : product.quantity;
          const item = { price: price.id, ...(quantity && { quantity }) };

          totalAmount += (price.unit_amount || 0) * (quantity || 0);

          if (price.type === 'recurring') {
            subscriptionItems.push(item);
          } else {
            oneTimePaymentItems.push(item);
          }
        }),
      );

      const applicationFeeAmount = applicationFee ? Math.round((totalAmount * applicationFee.feePercentage) / 100) : 0;

      if (subscriptionItems.length > 0 && oneTimePaymentItems.length > 0) {
        throw new Error('Cannot handle subscription items and one-time payment items in the same request');
      }

      if (subscriptionItems.length > 0 || oneTimePaymentItems.length > 0) {
        const lineItems = subscriptionItems.length > 0 ? subscriptionItems : oneTimePaymentItems;
        const mode = subscriptionItems.length > 0 ? 'subscription' : 'payment';

        const sessionData: Stripe.Checkout.SessionCreateParams = {
          success_url: successUrl,
          cancel_url: cancelUrl,
          line_items: lineItems,
          mode: mode,
          tax_id_collection: { enabled: true },
          automatic_tax: { enabled: true },
          billing_address_collection: 'required',
        };

        if (applicationFeeAmount > 0 && applicationFee) {
          sessionData.payment_intent_data = {
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
              destination: applicationFee.connectAccountId,
            },
          };
        }

        const session = await stripe.checkout.sessions.create(sessionData);
        return session.url;
      }
    },
  )(input.arguments, input.source);

