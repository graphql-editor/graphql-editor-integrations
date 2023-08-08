import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { MongoOrb } from "../db/orm.js";

export const handler = async (input: FieldResolveInput) => 
  resolverFor('Query', 'paymentIntents', async (args) => {
    const filter: any = { customer: args.filter.customerId };
    if(args.filter.status){
        filter.status = args.filter.status
    }
    return await MongoOrb('StripePaymentIntentCollection').collection.find(filter).toArray();
  })(input.arguments);
