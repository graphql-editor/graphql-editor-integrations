import { FieldResolveInput } from 'stucco-js';
import { InviteTokenCollection, TeamCollection, UserCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';
import { resolverForUser } from '../UserMiddleware.js';
import { JoinToTeamWithInvitationTokenError } from '../zeus/index.js';

export const joinToTeamWithInvitationToken = async (input: FieldResolveInput) =>
  resolverForUser('Mutation', 'joinToTeamWithInvitationToken', async ({ user, token }) => {
    const o = await orm();
    const inviteToken = await o(InviteTokenCollection).collection.findOne({
      token,
    });
    if (!inviteToken) {
      return { hasError: JoinToTeamWithInvitationTokenError.INVITATION_TOKEN_NOT_FOUND };
    }
    if (!inviteToken.teamId) {
      return { hasError: JoinToTeamWithInvitationTokenError.TEAM_IN_INVITATION_TOKEN_NOT_SPECIFIED };
    }
    const existingMember = await o(UserCollection).collection.findOne({
      username: user.username,
      teams: { $in: [inviteToken.teamId] },
    });
    if (existingMember) {
      return { hasError: JoinToTeamWithInvitationTokenError.MEMBER_ALREADY_EXISTS_IN_THE_TEAM };
    }
    const timestamp = parseInt(inviteToken.expires);
    const expirationDate = new Date(timestamp);
    const currentDate = new Date();
    if (currentDate.getTime() > expirationDate.getTime()) {
      return { hasError: JoinToTeamWithInvitationTokenError.INVITATION_TOKEN_EXPIRED };
    }
    await Promise.all([
      o(TeamCollection).collection.updateOne({ _id: inviteToken.teamId }, { $push: { members: user._id } }),
      o(UserCollection).collection.updateOne({ username: user.username }, { $push: { teams: inviteToken.teamId } }),
    ]);
    return {
      response: { result: true },
    };
  })(input.arguments, input);
export default joinToTeamWithInvitationToken;
