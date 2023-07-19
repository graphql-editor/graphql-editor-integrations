import Stripe from "stripe";
import { MongoOrb } from "../db/orm.js";

const upsertPaymentIntent = async (subEvent: Stripe.PaymentIntent) => {
    return await MongoOrb('PaymentIntentCollection').collection.updateOne(
        { id: subEvent.id },
        { $set: { ...subEvent } },
        { upsert: true }
    );
};

export const paymentIntentProcessing = upsertPaymentIntent;
export const paymentIntentCanceled = upsertPaymentIntent;
export const paymentIntentSucceeded = upsertPaymentIntent;
export const paymentIntentFailed = upsertPaymentIntent;
