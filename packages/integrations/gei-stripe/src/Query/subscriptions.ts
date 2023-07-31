import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { MongoOrb } from "../db/orm.js";

export const handler = async (input: FieldResolveInput) => 
  resolverFor('Query', 'subscriptions', async (args) => {
    const customerIdFilter = args?.filter?.customerId;
    
    if (!customerIdFilter) {
      return await MongoOrb('StripeSubscriptionCollection').collection.find().toArray();
    } else {
      const filter = { customer: customerIdFilter };
      return await MongoOrb('StripeSubscriptionCollection').collection.find(filter).toArray();
    }
  })(input.arguments);
