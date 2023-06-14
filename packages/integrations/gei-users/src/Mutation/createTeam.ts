import { FieldResolveInput } from 'stucco-js';
import { resolverForUser } from '../UserMiddleware.js';
import { TeamCollection, UserCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';
import { CreateTeamError } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverForUser('Mutation', 'createTeam', async ({ user, teamName }) => {
    const o = await orm();
    if (await o(TeamCollection).collection.findOne({ name: teamName })) return { result: false };
    const team = await o(TeamCollection).createWithAutoFields('_id', 'createdAt')({
      owner: user._id,
      name: teamName,
      members: [user._id],
    });
    if (!team.insertedId) return { hasError: CreateTeamError.TEAM_NOT_CREATED };
    await o(UserCollection).collection.updateOne({ _id: user._id }, { $push: { teams: team.insertedId.toString() } });
    return { result: team.insertedId };
  })(input.arguments, input);
