import { FieldResolveInput } from 'stucco-js';
import { resolverForUser } from '../UserMiddleware.js';
import { TeamCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverForUser('Query', 'team', async ({ user, teamId }) => {
    const o = await orm();
    if (user.teams.find((team: string) => team === teamId)) {
      return await o(TeamCollection).collection.findOne({ _id: teamId });
    }
  })(input.arguments, input);
