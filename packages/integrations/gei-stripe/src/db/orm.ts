import { iGraphQL } from 'i-graphql';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';
import { UserModel } from '../models/UserModel';

export const orm = async () => {
  return iGraphQL<
    {
      SubscriptionCollection: Stripe.Subscription,
      ProductCollection: Stripe.Product,
      PriceCollection: Stripe.Price
      CheckoutSessionsCollection: Stripe.Checkout.Session,
      PaymentIntentCollection: Stripe.PaymentIntent,
      TaxRateCollection: Stripe.TaxRate,
      InvoiceCollection: Stripe.Invoice,
      StripeUserCollection: UserModel
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
