import { NewIntegration } from 'graphql-editor-cli';
import { handler as initStripeCustomer } from './Mutation/initStripeCustomer.js';
import { handler as webhookHandler } from './Mutation/webhook.js';
export const integration = NewIntegration({
  Query: {
  },
  Mutation: {
    initStripeCustomer: {
      name: 'initStripeCustomer',
      description: 'Init stripe customer',
      handler: initStripeCustomer,
    },
    webhook: {
      name: 'webhook',
      description: 'Stripe webhook for managing mongo data',
      handler: webhookHandler,
    }
  },
});

export default integration;
