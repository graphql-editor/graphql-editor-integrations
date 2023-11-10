import { FieldResolveInput } from 'stucco-js';
import { resolverForUser } from '../UserMiddleware.js';
import { TeamCollection, TeamInvitationsCollection, UserCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';
import { InvitationTeamStatus, SendInvitationToTeamError } from '../zeus/index.js';
import { MailgunWrapper, formatInvitationToTeam } from '../mailgun.js';

export const sendInvitationToTeam = async (input: FieldResolveInput) =>
  resolverForUser('Mutation', 'sendInvitationToTeam', async ({ user, invitation: { username, teamId } }) => {
    const o = await orm();
    if (
      await o(TeamInvitationsCollection).collection.findOne({
        teamId,
        recipient: username,
        status: InvitationTeamStatus.Waiting,
      })
    ) {
      return { hasError: SendInvitationToTeamError.USER_ALREADY_HAS_YOUR_INVITATION };
    }
    if (username === user.username)
      return { hasError: SendInvitationToTeamError.YOU_CANNOT_SEND_INVITATION_TO_YOURSELF };
    const teamById = await o(TeamCollection).collection.findOne({ owner: user._id, _id: teamId });
    if (!teamById) return { hasError: SendInvitationToTeamError.USER_IS_NOT_OWNER_OF_THE_TEAM };
    const recipientUser = await o(UserCollection).collection.find({ username }).toArray();
    if (recipientUser.length === 0) return { hasError: SendInvitationToTeamError.CANNOT_FIND_USER };
    if (recipientUser.length > 2) return { hasError: SendInvitationToTeamError.USERNAME_IS_TOO_AMBIGUOUS };

    if (teamById.members.includes(recipientUser[0]._id))
      return { hasError: SendInvitationToTeamError.USER_ALREADY_EXISTS_IN_THE_TEAM };
    const result = await o(TeamInvitationsCollection).createWithAutoFields('_id')({
      teamId: teamById._id,
      teamName: teamById.name,
      recipient: username,
      status: InvitationTeamStatus.Waiting,
    });
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(recipientUser[0].username))
      MailgunWrapper()?.send(formatInvitationToTeam(username, teamById._id, teamById.name));
    return {
      response: { result: true },
      __meta: {
        invitationId: result.insertedId,
      },
    };
  })(input.arguments, input);
export default sendInvitationToTeam;
