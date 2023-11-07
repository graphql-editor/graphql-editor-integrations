import Stripe from 'stripe';
import { FieldResolveInput } from 'stucco-js';
import { newStripe } from '../utils/stripeInit.js';
import {
  stripeSubscriptionDelete,
  stripeSubscriptionInsert,
  stripeSubscriptionUpdate,
} from '../utils/webhookEvents/stripeSubscriptionEvents.js';
import { resolverFor } from '../zeus/index.js';
import {
  stripeProductDelete,
  stripeProductInsert,
  stripeProductUpdate,
} from '../utils/webhookEvents/stripeProductEvents.js';
import { stripePriceDelete, stripePriceInsert, stripePriceUpdate } from '../utils/webhookEvents/stripePriceEvents.js';
import { stripeCheckoutComplete } from '../utils/webhookEvents/checkoutSessionEvents.js';
import {
  paymentIntentCanceled,
  paymentIntentFailed,
  paymentIntentProcessing,
  paymentIntentSucceeded,
} from '../utils/webhookEvents/paymentIntentEvents.js';
import { taxRateCreated, taxRateUpdated } from '../utils/webhookEvents/tax_rateEvents.js';
import {
  invoiceMarkedUncollectible,
  invoicePaid,
  invoicePaymentActionRequired,
  invoicePaymentFailed,
  invoicePaymentSucceeded,
  invoiceUpcoming,
} from '../utils/webhookEvents/invoiceEvents.js';
import {
  customerDefaultSourceUpdated,
  customerDelete,
  customerInsert,
  customerUpdate,
} from '../utils/webhookEvents/customerEvents.js';
import {
  externalAccountDelete,
  externalAccountInsert,
  externalAccountUpdate,
} from '../utils/webhookEvents/externalAccountEvents.js';
import {
  paymentMethodAttached,
  paymentMethodDetached,
  paymentMethodUpdated,
} from '../utils/webhookEvents/paymentMethodEvents.js';
import { ExternalAccount } from '../utils/customTypes/types.js';

export const webhook = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'webhook', async (args) => {
    if (input.protocol?.body && input.protocol?.headers) {
      const stripe = newStripe();
      const STRIPE_SIGNING_KEY = process.env.STRIPE_SIGNING_KEY;
      const sig = input.protocol.headers['Stripe-Signature'];
      if (STRIPE_SIGNING_KEY && sig) {
        try {
          const ev = await stripe.webhooks.constructEventAsync(input.protocol.body, sig[0], STRIPE_SIGNING_KEY);
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
            case 'customer.created':
              return customerInsert(ev.data.object as Stripe.Customer);
            case 'customer.deleted':
              return customerDelete(ev.data.object as Stripe.Customer);
            case 'customer.updated':
              return customerUpdate(ev.data.object as Stripe.Customer);
            case 'customer.default_source_updated':
              return customerDefaultSourceUpdated(ev.data.object as Stripe.Customer);
            case 'account.external_account.created':
              return externalAccountInsert(ev.data.object as ExternalAccount);
            case 'account.external_account.deleted':
              return externalAccountDelete(ev.data.object as ExternalAccount);
            case 'account.external_account.updated':
              return externalAccountUpdate(ev.data.object as ExternalAccount);
            case 'payment_method.attached':
              return paymentMethodAttached(ev.data.object as Stripe.PaymentMethod);
            case 'payment_method.detached':
              return paymentMethodDetached(ev.data.object as Stripe.PaymentMethod);
            case 'payment_method.updated':
              return paymentMethodUpdated(ev.data.object as Stripe.PaymentMethod);
          }
        } catch (e) {
          throw new Error('cannot authorize request');
        }
      }
    }
  })(input.arguments);
export default webhook;
