import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils/stripeInit.js';
import { MongoOrb } from '../db/orm.js';

export const initStripeCustomer = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'initStripeCustomer', async (args) => {
    const { email, name, phone, address } = args.initStripeCustomerInput;
    const existingCustomer = await MongoOrb('StripeCustomerCollection').collection.findOne({ email: email });
    if (existingCustomer) {
      await MongoOrb('UserCollection').collection.updateOne(
        { username: args.initStripeCustomerInput.email },
        { $set: { stripeId: existingCustomer.id } },
        { upsert: true },
      );
      return true;
    } else {
      // Init customer with 'auto' data to allow further tax collection during payment
      const stripe = newStripe();
      const customerInput: any = {};
      customerInput.name = name ? name : 'auto';
      customerInput.address = address ? address : 'auto';
      customerInput.email = email;
      if (phone) {
        customerInput.phone = phone;
      }
      const customer = await stripe.customers.create({ email: args.initStripeCustomerInput.email });
      const res = await MongoOrb('UserCollection').collection.updateOne(
        { username: args.initStripeCustomerInput.email },
        { $set: { stripeId: customer.id } },
        { upsert: true },
      );
      return res.modifiedCount === 1;
    }
  })(input.arguments);
export default initStripeCustomer;
