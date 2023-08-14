import Stripe from "stripe";
import { MongoOrb } from "../../db/orm.js";
import { ExternalAccount } from "../customTypes/types.js";

export const externalAccountInsert = async (subEvent: ExternalAccount) => {
    return await MongoOrb('StripeExternalAccountCollection').collection.insertOne({
      ...subEvent
    });
  };
  
  export const externalAccountUpdate = async (subEvent: ExternalAccount) => {
    const { id, ...subEventWithoutId } = subEvent;
    return await MongoOrb('StripeExternalAccountCollection').collection.updateOne(
      { id: subEvent.id },
      { $set: subEventWithoutId },
      { upsert: true }
    );;
  };
  
  export const externalAccountDelete = async (subEvent: ExternalAccount) => {
    return await MongoOrb('StripeExternalAccountCollection').collection.deleteOne({ id: subEvent.id });
  };