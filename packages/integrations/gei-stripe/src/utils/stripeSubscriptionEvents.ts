import Stripe from "stripe";
import { MongoOrb } from "../db/orm.js";

export const stripeSubscriptionInsert = async (subEvent: Stripe.Subscription) => {
    return await MongoOrb('StripeSubscriptionCollection').collection.insertOne({
      ...subEvent
    });
  };
  
  export const stripeSubscriptionUpdate = async (subEvent: Stripe.Subscription) => {
    const { id, ...subEventWithoutId } = subEvent;
    return await MongoOrb('StripeSubscriptionCollection').collection.updateOne(
      { id: subEvent.id },
      { $set: subEventWithoutId }
    );;
  };
  
  export const stripeSubscriptionDelete = async (subEvent: Stripe.Subscription) => {
    return await MongoOrb('StripeSubscriptionCollection').collection.deleteOne({ id: subEvent.id });
  };