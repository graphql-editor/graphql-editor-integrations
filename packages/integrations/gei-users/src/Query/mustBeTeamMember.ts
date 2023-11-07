import { FieldResolveInput } from 'stucco-js';
import { getUserMemberFromHandlerInputOrThrow } from '../UserMiddleware.js';
import { resolverFor } from '../zeus/index.js';

export const mustBeTeamMember = async (input: FieldResolveInput) =>
  resolverFor('Query', 'mustBeTeamMember', async ({ teamId }) => {
    const userMember = await getUserMemberFromHandlerInputOrThrow(input, teamId);
    return userMember;
  })(input.arguments);
export default mustBeTeamMember;
