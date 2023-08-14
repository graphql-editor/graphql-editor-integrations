import Stripe from "stripe";
import { MongoOrb } from "../../db/orm.js";

export const stripeProductInsert = async (subEvent: Stripe.Product) => {
    return await MongoOrb('StripeProductCollection').collection.insertOne({
      ...subEvent
    });
  };
  
  export const stripeProductUpdate = async (subEvent: Stripe.Product) => {
    const { id, ...subEventWithoutId } = subEvent;
    return await MongoOrb('StripeProductCollection').collection.updateOne(
      { id: subEvent.id },
      { $set: subEventWithoutId },
      { upsert: true }
    );;
  };
  
  export const stripeProductDelete = async (subEvent: Stripe.Product) => {
    return await MongoOrb('StripeProductCollection').collection.deleteOne({ id: subEvent.id });
  };