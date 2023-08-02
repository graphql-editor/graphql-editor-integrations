import Stripe from "stripe";
import { MongoOrb } from "../db/orm.js";
export type ExternalAccount = Stripe.BankAccount | Stripe.Card;

export const externalAccountInsert = async (subEvent: ExternalAccount) => {
    return await MongoOrb('StripeExternalAccount').collection.insertOne({
      ...subEvent
    });
  };
  
  export const externalAccountUpdate = async (subEvent: ExternalAccount) => {
    const { id, ...subEventWithoutId } = subEvent;
    return await MongoOrb('StripeExternalAccount').collection.updateOne(
      { id: subEvent.id },
      { $set: subEventWithoutId }
    );;
  };
  
  export const externalAccountDelete = async (subEvent: ExternalAccount) => {
    return await MongoOrb('StripeExternalAccount').collection.deleteOne({ id: subEvent.id });
  };