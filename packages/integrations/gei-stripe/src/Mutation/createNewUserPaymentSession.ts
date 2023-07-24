import { MongoOrb } from '../db/orm.js';
import { newStripe } from '../utils/utils.js';
import { resolverFor } from '../zeus/index.js';
import { FieldResolveInput } from 'stucco-js';
type item = {
  price: string;
  quantity?: number;
};
export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'createNewUserPaymentSession', async ({ payload: { successUrl, cancelUrl, products } }) => {
    const stripe = newStripe();
    const subscriptionItems: item[] = [];
    const oneTimePaymentItems: item[] = [];

    await Promise.all(
      products.map(async (product) => {
        const { default_price } = await stripe.products.retrieve(product.productId);
        if (!default_price) {
          throw new Error('Cannot find product ' + product.productId + ' default price');
        }
        const price =
          typeof default_price === 'string'
            ? await stripe.prices.retrieve(default_price)
            : await stripe.prices.retrieve(default_price.id);

        const item = {
          price: price.id,
          ...(!price.recurring
            ? { quantity: product.quantity }
            : price.recurring.usage_type !== 'metered' && { quantity: 1 }),
        };

        if (price.type === 'recurring') {
          subscriptionItems.push(item);
        } else {
          oneTimePaymentItems.push(item);
        }
      }),
    );

    if (subscriptionItems.length > 0 && oneTimePaymentItems.length > 0) {
      throw new Error('Cannot handle subscription items and one-time payment items in the same request');
    }
    if (subscriptionItems.length > 0) {
      const session = await stripe.checkout.sessions.create({
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: subscriptionItems,
        mode: 'subscription',
        tax_id_collection: { enabled: true },
        automatic_tax: {
          enabled: true,
        },
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
      });
      return session.url;
    }

    if (oneTimePaymentItems.length > 0) {
      const session = await stripe.checkout.sessions.create({
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: oneTimePaymentItems,
        mode: 'payment',
        tax_id_collection: { enabled: true },
        automatic_tax: {
          enabled: true,
        },
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
      });
      return session.url;
    }
  })(input.arguments, input.source);
