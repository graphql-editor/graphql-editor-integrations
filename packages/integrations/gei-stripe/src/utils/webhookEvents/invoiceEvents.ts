import Stripe from "stripe";
import { MongoOrb } from "../../db/orm.js";

const upsertInvoice = async (invoiceEvent: Stripe.Invoice) => {
    return await MongoOrb('StripeInvoiceCollection').collection.updateOne(
        { id: invoiceEvent.id },
        { $set: { ...invoiceEvent } },
        { upsert: true }
    );
};

export const invoicePaid = upsertInvoice;
export const invoicePaymentSucceeded = upsertInvoice;
export const invoicePaymentFailed = upsertInvoice;
export const invoiceUpcoming = upsertInvoice;
export const invoicePaymentActionRequired = upsertInvoice;
export const invoiceMarkedUncollectible = upsertInvoice;

