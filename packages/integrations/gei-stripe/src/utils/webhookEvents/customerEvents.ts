import Stripe from 'stripe';
import { MongoOrb } from "../../db/orm.js";

export const customerInsert = async (subEvent: Stripe.Customer) => {
  return await MongoOrb('StripeCustomerCollection').collection.insertOne({
    ...subEvent,
  });
};

export const customerUpdate = async (subEvent: Stripe.Customer) => {
  const { id, ...subEventWithoutId } = subEvent;
  return await MongoOrb('StripeCustomerCollection').collection.updateOne(
    { id: subEvent.id },
    { $set: subEventWithoutId },
    { upsert: true }
  );
};

export const customerDelete = async (subEvent: Stripe.Customer) => {
  return await MongoOrb('StripeCustomerCollection').collection.deleteOne({ id: subEvent.id });
};

export const customerDefaultSourceUpdated = customerUpdate;
