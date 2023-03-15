import { FieldResolveInput } from 'stucco-js';
import { resolverForUser } from '../UserMiddleware.js';
import { TeamCollection, TeamInvitationsCollection, UserCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';
import { RemoveUserFromTeamError } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverForUser('Mutation', 'removeUserFromTeam', async ({ user, data: { userId, teamId } }) => {
    const o = await orm();
    const team = await o(TeamCollection).collection.findOne({ owner: user._id, _id: teamId });
    if (!team) {
      return { hasError: RemoveUserFromTeamError.YOU_ARE_NOT_THE_OWNER_OF_A_TEAM_OR_TEAM_DOES_NOT_EXIST };
    }
    if (user._id == userId) {
      return { hasError: RemoveUserFromTeamError.YOU_CANNOT_KICK_YOURSELF_FROM_THE_TEAM };
    }
    const foundUser = await o(UserCollection).collection.findOne({ userId });
    if (!foundUser) return { hasError: RemoveUserFromTeamError.USER_NOT_FOUND };
    await Promise.all([
      o(TeamInvitationsCollection).collection.deleteOne({ teamId: teamId, recipient: userId }),
      o(UserCollection).collection.updateOne({ userId }, { $pull: { teams: teamId } }),
      o(TeamCollection).collection.updateOne({ _id: teamId }, { $pull: { members: foundUser._id } }),
    ]);
    return { result: true };
  })(input.arguments, input);
