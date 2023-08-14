import Stripe from 'stripe';
import { MongoOrb } from "../../db/orm.js";

export const paymentMethodAttached = async (subEvent: Stripe.PaymentMethod) => {
  return await MongoOrb('PaymentMethodCollection').collection.insertOne({
    ...subEvent,
  });
};

export const paymentMethodUpdated = async (subEvent: Stripe.PaymentMethod) => {
  const { id, ...subEventWithoutId } = subEvent;
  return await MongoOrb('PaymentMethodCollection').collection.updateOne(
    { id: subEvent.id },
    { $set: subEventWithoutId },
    { upsert: true }
  );
};

export const paymentMethodDetached = async (subEvent: Stripe.PaymentMethod) => {
  return await MongoOrb('PaymentMethodCollection').collection.deleteOne({ id: subEvent.id });
};
