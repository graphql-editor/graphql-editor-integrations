import { NewIntegration } from 'graphql-editor-cli';
import { handler as initStripeCustomerHandler } from './Mutation/initStripeCustomer.js';
import { handler as webhookHandler } from './Mutation/webhook.js';
import { handler as createCustomerPortalHandler } from './Mutation/createCustomerPortal.js';
import { handler as createCheckoutSessionHandler } from './Mutation/createCheckoutSession.js';
import { handler as createNewUserCheckoutSessionHandler } from './Mutation/createNewUserCheckoutSession.js';
import { handler as productsHandler } from './Query/products.js';
import { handler as productDefaultPriceHandler } from './StripeProduct/default_price.js';
import { handler as productPricesHandler } from './StripeProduct/prices.js';
import { handler as subscriptionsHandler } from './Query/subscriptions.js';
import { handler as attachPaymentMethodHandler } from './Mutation/attachPaymentMethod.js';
import { handler as createConnectAccountHandler } from './Mutation/createConnectAccount.js';
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
    attachPaymentMethod: {
      name: 'attachPaymentMethod',
      description: 'attach payment method created on the frontend to existing stripe customer',
      handler: attachPaymentMethodHandler,
    },
    createCheckoutSession: {
      name: 'createCheckoutSession',
      description: 'Creates payment session for already existing user',
      handler: createCheckoutSessionHandler,
    },
    createConnectAccount: {
      name: 'createConnectAccount',
      description: 'Creates stripe connect account for specific payments design with application fees or custom withdrawals',
      handler: createConnectAccountHandler,
    },
    createCustomerPortal: {
      name: 'createCustomerPortal',
      description: 'Creates customer portal for managing account and subscriptions',
      handler: createCustomerPortalHandler,
    },
    initStripeCustomer: {
      name: 'initStripeCustomer',
      description: 'Init stripe customer',
      handler: initStripeCustomerHandler,
    },
    createNewUserCheckoutSession: {
      name: 'reateNewUserCheckoutSession',
      description: 'Creates payment session for user that is not yet registered',
      handler: createNewUserCheckoutSessionHandler,
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