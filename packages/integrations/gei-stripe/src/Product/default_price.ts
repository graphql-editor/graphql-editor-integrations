import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import Stripe from 'stripe';
import { MongoOrb } from '../db/orm.js';

export const default_price = async (input: FieldResolveInput) =>
  resolverFor('Product', 'default_price', async (_, src: Stripe.Product) => {
    if (typeof src.default_price === 'string') {
      return await MongoOrb('StripePriceCollection').collection.findOne({ id: src.default_price });
    } else {
      return null;
    }
  })(input.arguments, input.source);
export default default_price;
