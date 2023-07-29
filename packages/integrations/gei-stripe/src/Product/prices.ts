import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import Stripe from 'stripe';
import { MongoOrb } from '../db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Product','prices', async (_, src: Stripe.Product) => {
    const cursor = MongoOrb('PriceCollection').collection.find({ product: src.id });
    const prices = await cursor.toArray();
    return prices;
  })(input.arguments, input.source);