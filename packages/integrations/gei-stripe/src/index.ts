import { NewIntegration } from 'graphql-editor-cli';
import { handler as initStripeCustomerHandler } from './Mutation/initStripeCustomer.js';
import { handler as webhookHandler } from './Mutation/webhook.js';
import { handler as createCustomerPortalHandler } from './Mutation/createCustomerPortal.js';
import { handler as createCheckoutSessionHandler } from './Mutation/createCheckoutSession.js';
import { handler as createNewUserCheckoutSessionHandler } from './Mutation/createNewUserCheckoutSession.js';
import { handler as productsHandler } from './Query/products.js';
import { handler as productDefaultPriceHandler } from './Product/default_price.js';
import { handler as productPricesHandler } from './Product/prices.js';
import { handler as subscriptionsHandler } from './Query/subscriptions.js';
import { handler as attachPaymentMethodHandler } from './Mutation/attachPaymentMethod.js';
import { handler as createConnectAccountHandler } from './Mutation/createConnectAccount.js';
import { handler as setDefaultPaymentMethodHandler } from './Mutation/setDefaultPaymentMethod.js';
import { handler as paymentIntentsHandler } from './Query/paymentIntents.js';
import { handler as invoicesHandler } from './Query/invoices.js';
import { handler as customerHandler } from './Query/customer.js';
import { handler as paymentMethodHandler } from './Customer/paymentMethods.js';

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
    },
    paymentIntents: {
      name: 'paymentIntents',
      description: 'List stripe payment intents',
      handler: paymentIntentsHandler,
    },
    invoices: {
      name: 'invoices',
      description: 'List stripe invoices for specific user',
      handler: invoicesHandler,
    },
    customer: {
      name: 'customer',
      description: 'Show stripe customer object with payment methods',
      handler: customerHandler,
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
      name: 'createNewUserCheckoutSession',
      description: 'Creates payment session for user that is not yet registered',
      handler: createNewUserCheckoutSessionHandler,
    },
    setDefaultPaymentMethod: {
      name: 'setDefaultPaymentMethod',
      description: 'Sets default user payment method',
      handler: setDefaultPaymentMethodHandler,
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
  },
  Customer: {
    paymentMethods: {
      name: 'paymentMethods',
      description: 'Resolver for querying customer payment methods',
      handler: paymentMethodHandler,
    },
  }
});

export default integration;