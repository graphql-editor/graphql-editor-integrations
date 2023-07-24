import Stripe from 'stripe';
import { FieldResolveInput } from 'stucco-js';
import { newStripe } from '../utils/utils.js';
import {
  stripeSubscriptionDelete,
  stripeSubscriptionInsert,
  stripeSubscriptionUpdate,
} from '../utils/stripeSubscriptionEvents.js';
import { resolverFor } from '../zeus/index.js';
import { stripeProductDelete, stripeProductInsert, stripeProductUpdate } from '../utils/stripeProductEvents.js';
import { stripePriceDelete, stripePriceInsert, stripePriceUpdate } from '../utils/stripePriceEvents.js';
import { stripeCheckoutComplete } from '../utils/checkoutSessionEvents.js';
import {
  paymentIntentCanceled,
  paymentIntentFailed,
  paymentIntentProcessing,
  paymentIntentSucceeded,
} from '../utils/paymentIntentEvents.js';
import { taxRateCreated, taxRateUpdated } from '../utils/tax_rateEvents.js';
import {
  invoiceMarkedUncollectible,
  invoicePaid,
  invoicePaymentActionRequired,
  invoicePaymentFailed,
  invoicePaymentSucceeded,
  invoiceUpcoming,
} from '../utils/invoiceEvents.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'webhook', async (args) => {
    console.log('NEW REQUEST');
    if (input.protocol?.body && input.protocol?.headers) {
      const stripe = newStripe();
      const STRIPE_SIGNING_KEY = process.env.STRIPE_SIGNING_KEY;
      const sig = input.protocol.headers['Stripe-Signature'];
      if (STRIPE_SIGNING_KEY && sig) {
        try {
          const ev = await stripe.webhooks.constructEventAsync(input.protocol.body, sig[0], STRIPE_SIGNING_KEY);
          console.log(ev.type);
          switch (ev.type) {
            case 'customer.subscription.created':
              return stripeSubscriptionInsert(ev.data.object as Stripe.Subscription);
            case 'customer.subscription.updated':
              return stripeSubscriptionUpdate(ev.data.object as Stripe.Subscription);
            case 'customer.subscription.deleted':
              return stripeSubscriptionDelete(ev.data.object as Stripe.Subscription);
            case 'product.created':
              return stripeProductInsert(ev.data.object as Stripe.Product);
            case 'product.updated':
              return stripeProductUpdate(ev.data.object as Stripe.Product);
            case 'product.deleted':
              return stripeProductDelete(ev.data.object as Stripe.Product);
            case 'price.created':
              return stripePriceInsert(ev.data.object as Stripe.Price);
            case 'price.updated':
              return stripePriceUpdate(ev.data.object as Stripe.Price);
            case 'price.deleted':
              return stripePriceDelete(ev.data.object as Stripe.Price);
            case 'checkout.session.completed':
              return stripeCheckoutComplete(ev.data.object as Stripe.Checkout.Session);
            case 'payment_intent.processing':
              return paymentIntentProcessing(ev.data.object as Stripe.PaymentIntent);
            case 'payment_intent.canceled':
              return paymentIntentCanceled(ev.data.object as Stripe.PaymentIntent);
            case 'payment_intent.succeeded':
              return paymentIntentSucceeded(ev.data.object as Stripe.PaymentIntent);
            case 'payment_intent.payment_failed':
              return paymentIntentFailed(ev.data.object as Stripe.PaymentIntent);
            case 'tax_rate.created':
              return taxRateCreated(ev.data.object as Stripe.TaxRate);
            case 'tax_rate.created':
              return taxRateUpdated(ev.data.object as Stripe.TaxRate);
            case 'invoice.paid':
              return invoicePaid(ev.data.object as Stripe.Invoice);
            case 'invoice.payment_succeeded':
              return invoicePaymentSucceeded(ev.data.object as Stripe.Invoice);
            case 'invoice.payment_failed':
              return invoicePaymentFailed(ev.data.object as Stripe.Invoice);
            case 'invoice.upcoming':
              return invoiceUpcoming(ev.data.object as Stripe.Invoice);
            case 'invoice.marked_uncollectible':
              return invoiceMarkedUncollectible(ev.data.object as Stripe.Invoice);
            case 'invoice.payment_action_required':
              return invoicePaymentActionRequired(ev.data.object as Stripe.Invoice);
          }
        } catch (e) {
          throw new Error('cannot authorize request');
        }
      }
    }
  })(input.arguments);
