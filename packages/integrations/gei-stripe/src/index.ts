import { NewIntegration } from 'graphql-editor-cli';
import { handler as initStripeCustomerHandler } from './Mutation/initStripeCustomer.js';
import { handler as webhookHandler } from './Mutation/webhook.js';
import { handler as createCustomerPortalHandler } from './Mutation/createCustomerPortal.js';
import { handler as createPaymentSessionHandler } from './Mutation/createPaymentSession.js';
import { handler as createNewUserPaymentSessionHandler } from './Mutation/createNewUserPaymentSession.js';
import { handler as productsHandler } from './Query/products.js';
import { handler as productDefaultPriceHandler } from './StripeProduct/default_price.js';
import { handler as productPricesHandler } from './StripeProduct/prices.js';
import { handler as subscriptionsHandler } from './Query/subscriptions.js';

export const integration = NewIntegration({
  Query: {
    products: {
      name: 'products',
      description: 'List stripe products with corresponding prices',
      handler: productsHandler,
    },
    subscriptions: {
      name: 'subscriptions',
      description: 'List stripe subscriptions with corresponding prices',
      handler: subscriptionsHandler,
    }
  },
  Mutation: {
    initStripeCustomer: {
      name: 'initStripeCustomer',
      description: 'Init stripe customer',
      handler: initStripeCustomerHandler,
    },
    createCustomerPortal: {
      name: 'createCustomerPortal',
      description: 'Creates customer portal for managing account and subscriptions',
      handler: createCustomerPortalHandler,
    },
    createPaymentSession: {
      name: 'createPaymentSession',
      description: 'Creates payment session for already existing user',
      handler: createPaymentSessionHandler,
    },
    createNewUserPaymentSession: {
      name: 'createNewUserPaymentSession',
      description: 'Creates payment session for user that is not yet registered',
      handler: createNewUserPaymentSessionHandler,
    },
    webhook: {
      name: 'webhook',
      description: 'Stripe webhook for managing mongo data',
      handler: webhookHandler,
    }
  },
  Product: {
    default_price: {
      name: 'default_price',
      description: 'Resolver for querying default price object',
      handler: productDefaultPriceHandler,
    },
    prices: {
      name: 'prices',
      description: 'Resolver for querying prices objects',
      handler: productPricesHandler,
    },
  }
});

export default integration;