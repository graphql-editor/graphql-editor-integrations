import Stripe from 'stripe';
import { MongoOrb } from '../db/orm.js';

export const paymentMethodAttached = async (subEvent: Stripe.PaymentMethod) => {
  return await MongoOrb('PaymentMethodCollection').collection.insertOne({
    ...subEvent,
  });
};

export const paymentMethodDetached = async (subEvent: Stripe.PaymentMethod) => {
  return await MongoOrb('PaymentMethodCollection').collection.deleteOne({ id: subEvent.id });
};
