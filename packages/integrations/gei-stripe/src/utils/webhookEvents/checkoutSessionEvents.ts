import Stripe from "stripe";
import { MongoOrb } from "../../db/orm.js";

export const stripeCheckoutComplete = async (subEvent: Stripe.Checkout.Session) => {
    return await MongoOrb('StripeCheckoutSessionsCollection').collection.insertOne({
      ...subEvent
    });
};