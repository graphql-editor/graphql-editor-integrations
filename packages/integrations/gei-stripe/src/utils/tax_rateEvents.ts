import Stripe from "stripe";
import { MongoOrb } from "../db/orm.js";

export const taxRateCreated = async (subEvent: Stripe.TaxRate) => {
    return await MongoOrb('TaxRateCollection').collection.insertOne({
      ...subEvent
    });
};
  
export const taxRateUpdated = async (subEvent: Stripe.TaxRate) => {
const { id, ...subEventWithoutId } = subEvent;
return await MongoOrb('TaxRateCollection').collection.updateOne(
    { id: subEvent.id },
    { $set: subEventWithoutId }
);;
};
  