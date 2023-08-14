import Stripe from "stripe";
import { MongoOrb } from "../../db/orm.js";

export const stripePriceInsert = async (subEvent: Stripe.Price) => {
    return await MongoOrb('StripePriceCollection').collection.insertOne({
      ...subEvent
    });
  };
  
  export const stripePriceUpdate = async (subEvent: Stripe.Price) => {
    const { id, ...subEventWithoutId } = subEvent;
    return await MongoOrb('StripePriceCollection').collection.updateOne(
      { id: subEvent.id },
      { $set: subEventWithoutId },
      { upsert: true }
    );;
  };
  
  export const stripePriceDelete = async (subEvent: Stripe.Price) => {
    return await MongoOrb('StripePriceCollection').collection.deleteOne({ id: subEvent.id });
  };