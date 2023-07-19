import Stripe from "stripe";
import { MongoOrb } from "../db/orm.js";

export const stripeProductInsert = async (subEvent: Stripe.Product) => {
    return await MongoOrb('ProductCollection').collection.insertOne({
      ...subEvent
    });
  };
  
  export const stripeProductUpdate = async (subEvent: Stripe.Product) => {
    const { id, ...subEventWithoutId } = subEvent;
    return await MongoOrb('ProductCollection').collection.updateOne(
      { id: subEvent.id },
      { $set: subEventWithoutId }
    );;
  };
  
  export const stripeProductDelete = async (subEvent: Stripe.Product) => {
    return await MongoOrb('ProductCollection').collection.deleteOne({ id: subEvent.id });
  };