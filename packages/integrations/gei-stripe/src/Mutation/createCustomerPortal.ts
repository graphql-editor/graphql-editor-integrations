import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils/stripeInit.js';
import { MongoOrb } from '../db/orm.js';

export const createCustomerPortal = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'createCustomerPortal', async ({ payload: { returnUrl, username } }) => {
    const stripe = newStripe();
    const user = await MongoOrb('UserCollection').collection.findOne({ username });
    if (!user) {
      throw new Error('Cannot find user with specific username');
    }
    if (!user.stripeId) {
      throw new Error('Stripe customer not initialized');
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeId,
      return_url: returnUrl,
    });
    return session.url;
  })(input.arguments, input.source);
export default createCustomerPortal;
