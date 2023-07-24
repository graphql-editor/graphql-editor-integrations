import { NewIntegration } from 'graphql-editor-cli';
import { handler as initStripeCustomerHandler } from './Mutation/initStripeCustomer.js';
import { handler as webhookHandler } from './Mutation/webhook.js';
import { handler as createCustomerPortalHandler } from './Mutation/createCustomerPortal.js';
import { handler as createPaymentSessionHandler } from './Mutation/createPaymentSession.js';
import { handler as createNewUserPaymentSessionHandler } from './Mutation/createNewUserPaymentSession.js';
export const integration = NewIntegration({
  Query: {
  },
  Mutation: {
    initStripeCustomer: {
      name: 'initStripeCustomer',
      description: 'Init stripe customer',
      handler: initStripeCustomerHandler,
    },
    createCustomerPortal: {
      name: 'createCustomerPortal',
      description: 'Creates customer portal for managing accound and subscriptions',
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
});

export default integration;
