import { NewIntegration } from 'graphql-editor-cli';
import { handler as initStripeCustomer } from './Mutation/initStripeCustomer.js';

export const integration = NewIntegration({
  Query: {
  },
  Mutation: {
    initStripeCustomer: {
      name: 'initStripeCustomer',
      description: 'Init stripe customer',
      handler: initStripeCustomer,
    },
  },
});

export default integration;
