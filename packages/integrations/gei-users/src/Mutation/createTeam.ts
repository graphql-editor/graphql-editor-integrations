import { FieldResolveInput } from 'stucco-js';
import { resolverForUser } from '../UserMiddleware.js';
import { TeamCollection, UserCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';
import Stripe from 'stripe';
import { CreateTeamError } from '../zeus/index.js';

export const createTeam = async (input: FieldResolveInput) =>
  resolverForUser('Mutation', 'createTeam', async ({ user, teamName, createStripeCustomer }) => {
    const o = await orm();
    if (await o(TeamCollection).collection.findOne({ name: teamName }))
      return { hasError: CreateTeamError.TEAM_EXISTS };
    const team = await o(TeamCollection).createWithAutoFields(
      '_id',
      'createdAt',
    )({
      owner: user._id,
      name: teamName,
      members: [user._id],
    });
    if (!team.insertedId) return { hasError: CreateTeamError.TEAM_NOT_CREATED };

    if (createStripeCustomer) {
      const customer = await newStripe().customers.create({
        name: teamName,
        email: user.username,
      });

      if (!customer) {
        await o(TeamCollection).collection.deleteOne({ _id: team.insertedId });
        return { hasError: CreateTeamError.STRIPE_ERROR };
      }
      await o(TeamCollection).collection.updateOne(
        { _id: team.insertedId },
        { $set: { customerId: customer.id, email: user.username } },
      );
    }
    await o(UserCollection).collection.updateOne({ _id: user._id }, { $push: { teams: team.insertedId.toString() } });
    return { result: team.insertedId };
  })(input.arguments, input);
export default createTeam;

const newStripe = (stripeKey = process.env.STRIPE_KEY) => {
  if (!stripeKey) throw new Error('missing stripe key');
  return new Stripe(stripeKey, {
    apiVersion: '2022-11-15',
  });
};
