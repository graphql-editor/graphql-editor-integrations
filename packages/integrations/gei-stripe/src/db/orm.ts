import { iGraphQL } from 'i-graphql';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';
import { StripeUserModel } from '../models/StripeUserModel';

export const orm = async () => {
  return iGraphQL<
    {
      StripeSubscriptionCollection: Stripe.Subscription,
      StripeProductCollection: Stripe.Product,
      StripePriceCollection: Stripe.Price
      StripeCheckoutSessionsCollection: Stripe.Checkout.Session,
      StripePaymentIntentCollection: Stripe.PaymentIntent,
      StripeTaxRateCollection: Stripe.TaxRate,
      StripeInvoiceCollection: Stripe.Invoice,
      UserCollection: StripeUserModel
      StripeCustomerCollection: Stripe.Customer
    },
    {
      _id: () => string;
      createdAt: () => string;
    }
  >({
    _id: () => new ObjectId().toHexString(),
    createdAt: () => new Date().toISOString(),
  });
};

export const MongoOrb = await orm();
