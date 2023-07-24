import Stripe from "stripe";
import { MongoOrb } from "../db/orm.js";

export const stripePriceInsert = async (subEvent: Stripe.Price) => {
    return await MongoOrb('PriceCollection').collection.insertOne({
      ...subEvent
    });
  };
  
  export const stripePriceUpdate = async (subEvent: Stripe.Price) => {
    const { id, ...subEventWithoutId } = subEvent;
    return await MongoOrb('PriceCollection').collection.updateOne(
      { id: subEvent.id },
      { $set: subEventWithoutId }
    );;
  };
  
  export const stripePriceDelete = async (subEvent: Stripe.Price) => {
    return await MongoOrb('PriceCollection').collection.deleteOne({ id: subEvent.id });
  };