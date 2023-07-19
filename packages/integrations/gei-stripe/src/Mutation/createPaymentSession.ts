import { MongoOrb } from '../db/orm';
import { newStripe } from '../utils/utils';
import { resolverFor } from '../zeus/index';
import { FieldResolveInput } from 'stucco-js';
type item = {
  price: string;
  quantity?: number;
};
export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'createPaymentSession', async ({ payload: { successUrl, cancelUrl, products, userEmail } }) => {
    const stripe = newStripe();
    const user = await MongoOrb('UserCollection').collection.findOne(
        { email: userEmail },
      );
    if (!user) {
      throw new Error('Invalid product or customer');
    }
    if (!user.stripeId) {
        throw new Error('Stripe customer not initialized');
    }

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
        customer: user.stripeId,
        tax_id_collection: { enabled: true },
        subscription_data: {
          metadata: { assignedTo: user.email },
        },
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
        customer: user.stripeId,
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
