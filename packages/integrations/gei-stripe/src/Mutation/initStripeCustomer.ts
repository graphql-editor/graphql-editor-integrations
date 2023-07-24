import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils/utils.js';
import { MongoOrb } from '../db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'initStripeCustomer', async (args) => {
    const { email, name, phone, address } = args.initStripeCustomerInput;
    try {
      const stripe = newStripe();
      const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined,
      });
      await MongoOrb('StripeUserCollection').collection.updateOne(
        { email: args.initStripeCustomerInput.email },
        { $set: { stripeId: customer.id } },
        { upsert: true },
      );
      return customer;
    } catch (error) {
      throw new Error('Failed to create Stripe customer.');
    }
  })(input.arguments);
