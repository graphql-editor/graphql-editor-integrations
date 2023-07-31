
import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils/utils.js';
import { MongoOrb } from '../db/orm.js';


export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'createCustomerPortal', async ({ payload: { returnUrl, userEmail } }) => {
    const stripe = newStripe();
    const user = await MongoOrb('UserCollection').collection.findOne(
        { email: userEmail },
      );
    if (!user) {
      throw new Error('Invalid product or customer');
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

  