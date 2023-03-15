import { FieldResolveInput } from 'stucco-js';
import { resolverForUser } from '../UserMiddleware.js';
import { TeamCollection, TeamInvitationsCollection, UserCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';
import { InvitationTeamStatus, JoinToTeamError } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverForUser('Mutation', 'joinToTeam', async ({ user, teamId }) => {
    const o = await orm();
    const invitation = await o(TeamInvitationsCollection).collection.findOne({
      teamId,
      recipient: user.username,
      status: InvitationTeamStatus.Waiting,
    });
    if (!invitation) {
      return { hasError: JoinToTeamError.TEAM_INVITATION_DOES_NOT_EXIST_OR_CAPTURED };
    }
    const existingMember = await o(UserCollection).collection.findOne({
      username: user.username,
      teams: { $in: [teamId] },
    });
    if (existingMember) {
      return { hasError: JoinToTeamError.MEMBER_ALREADY_EXISTS_IN_THE_TEAM };
    }
    await Promise.all([
      o(TeamInvitationsCollection).collection.updateOne(
        { teamId, recipient: user.username },
        { $set: { status: InvitationTeamStatus.Taken } },
      ),
      o(TeamCollection).collection.updateOne({ _id: invitation.teamId }, { $push: { members: user._id } }),
      o(UserCollection).collection.updateOne({ username: user.username }, { $push: { teams: invitation.teamId } }),
    ]);
    return {
      response: { result: true },
    };
  })(input.arguments, input);
