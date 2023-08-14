
import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { CustomerModel } from '../models/CustomerModel.js';
import { MongoOrb } from '../db/orm.js';

export const handler = async (input: FieldResolveInput) => 
  resolverFor('Customer','paymentMethods',async (_, src: CustomerModel) => {
    const cursor = MongoOrb('PaymentMethodCollection').collection.find({ customer: src.id });
    const paymentMethods = await cursor.toArray();
    return paymentMethods;
  })(input.arguments, input.source);
