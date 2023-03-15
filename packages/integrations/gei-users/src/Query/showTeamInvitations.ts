import { FieldResolveInput } from 'stucco-js';
import { resolverForUser } from '../UserMiddleware.js';
import { TeamInvitationsCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverForUser('Query', 'showTeamInvitations', async ({ user, status }) => {
    const invitations = await orm().then(
      async (o) => await o(TeamInvitationsCollection).collection.find({ recipient: user.username, status }).toArray(),
    );
    return invitations || [];
  })(input.arguments, input);
