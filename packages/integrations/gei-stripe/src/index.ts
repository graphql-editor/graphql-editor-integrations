import { NewIntegration } from 'graphql-editor-cli';
import initStripeCustomerHandler from './Mutation/initStripeCustomer.js';
import webhookHandler from './Mutation/webhook.js';
import createCustomerPortalHandler from './Mutation/createCustomerPortal.js';
import createCheckoutSessionHandler from './Mutation/createCheckoutSession.js';
import createNewUserCheckoutSessionHandler from './Mutation/createNewUserCheckoutSession.js';
import createPayoutForConnectedAccountHandler from './Mutation/createPayoutForConnectedAccount.js';
import productsHandler from './Query/products.js';
import productDefaultPriceHandler from './Product/default_price.js';
import productPricesHandler from './Product/prices.js';
import subscriptionsHandler from './Query/subscriptions.js';
import attachPaymentMethodHandler from './Mutation/attachPaymentMethod.js';
import createConnectAccountHandler from './Mutation/createConnectAccount.js';
import setDefaultPaymentMethodHandler from './Mutation/setDefaultPaymentMethod.js';
import paymentIntentsHandler from './Query/paymentIntents.js';
import invoicesHandler from './Query/invoices.js';
import customerHandler from './Query/customer.js';
import paymentMethodHandler from './Customer/paymentMethods.js';

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
    },
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
      description:
        'Creates stripe connect account for specific payments design with application fees or custom withdrawals',
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
    createPayoutForConnectedAccount: {
      name: 'createPayoutForConnectedAccount',
      description: 'Creates payout for one payment to connection account',
      handler: createPayoutForConnectedAccountHandler,
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
    },
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
  },
});

export default integration;
