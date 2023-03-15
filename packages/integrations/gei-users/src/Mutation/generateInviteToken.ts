import { FieldResolveInput } from 'stucco-js';
import crypto from 'crypto';
import { InviteTokenCollection, TeamCollection } from '../db/collections.js';
import { resolverForUser } from '../UserMiddleware.js';
import { orm } from '../db/orm.js';
import { getEnv } from '../envGuard.js';
import { GenerateInviteTokenError } from '../zeus/index.js';

export const isUserOwnerOfTeam = async (userId: string, o: Awaited<ReturnType<typeof orm>>, team: string) =>
  (await o(TeamCollection).collection.findOne({ owner: userId, name: team })) ? true : false;

export const genRandomString = (length: number) =>
  crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);

export const handler = async (input: FieldResolveInput) =>
  resolverForUser('Mutation', 'generateInviteToken', async ({ user, tokenOptions: { expires, domain, teamId } }) => {
    const o = await orm();
    domain = domain || '';
    expires = expires
      ? new Date(expires).setDate(new Date(expires).getDate() + 1).toString()
      : new Date().setDate(new Date().getDate() + Number(getEnv('INVITE_TOKEN_EXPIRES_DAYS') || 3)).toString();
    let generatedToken: string;

    do {
      generatedToken = genRandomString(16);
    } while ((await o(InviteTokenCollection).collection.findOne({ token: generatedToken })) !== null);

    if (teamId) {
      const userTeam = await o(TeamCollection).collection.findOne({ owner: user._id, _id: teamId });
      if (!userTeam)
        return { hasError: GenerateInviteTokenError.YOU_ARE_NOT_THE_OWNER_OF_A_TEAM_OR_TEAM_DOES_NOT_EXIST };
      await o(InviteTokenCollection).createWithAutoFields('_id')({
        token: generatedToken,
        expires,
        domain,
        owner: user._id,
        teamId: userTeam._id,
      });
      return { result: generatedToken };
    }

    await o(InviteTokenCollection).createWithAutoFields('_id')({
      token: generatedToken,
      expires,
      domain,
      owner: user._id,
    });

    return { result: generatedToken };
  })(input.arguments, input);
