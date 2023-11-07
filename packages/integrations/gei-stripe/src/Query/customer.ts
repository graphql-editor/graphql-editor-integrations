import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { MongoOrb } from '../db/orm.js';

export const customer = async (input: FieldResolveInput) =>
  resolverFor('Query', 'customer', async (args) => {
    const filter = { id: args.customerId };
    return await MongoOrb('StripeCustomerCollection').collection.findOne(filter);
  })(input.arguments);
export default customer;
