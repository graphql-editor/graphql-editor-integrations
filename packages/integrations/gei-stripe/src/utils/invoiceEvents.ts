import Stripe from "stripe";
import { MongoOrb } from "../db/orm";

const upsertInvoice = async (invoiceEvent: Stripe.Invoice) => {
    return await MongoOrb('InvoiceCollection').collection.updateOne(
        { id: invoiceEvent.id },
        { $set: { ...invoiceEvent } },
        { upsert: true } // creates a new document if no documents match the filter
    );
};

export const invoicePaid = upsertInvoice;
export const invoicePaymentSucceeded = upsertInvoice;
export const invoicePaymentFailed = upsertInvoice;
export const invoiceUpcoming = upsertInvoice;
export const invoicePaymentActionRequired = upsertInvoice;
export const invoiceMarkedUncollectible = upsertInvoice;

