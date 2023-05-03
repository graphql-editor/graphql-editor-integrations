import { FieldResolveInput } from 'stucco-js';
import {
  InviteTokenCollection,
  TeamCollection,
  UserAuthorizationCollection,
  UserCollection,
} from '../db/collections.js';
import { passwordSha512 } from '../UserMiddleware.js';
import crypto from 'crypto';
import { RegisterErrors, resolverFor } from '../zeus/index.js';
import { MailgunWrapper, formatVerifyEmail } from '../mailgun.js';
import { orm } from '../db/orm.js';

export const isPasswordEqualToSpecialParams = (password: string): boolean =>
  /[!@#\$%\^\&*\)\(+=._-]/.test(password) && /[a-z]/.test(password) && /[A-Z]/.test(password) && !/\s/.test(password);

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'register', async ({ user: { username, password, invitationToken, ...rest } }) => {
    const o = await orm();
    if (password.length <= 6) {
      return {
        hasError: RegisterErrors.PASSWORD_WEAK,
      };
    }
    if (!isPasswordEqualToSpecialParams(password)) {
      return {
        hasError: RegisterErrors.PASSWORD_WEAK,
      };
    }
    const user = await o(UserAuthorizationCollection).collection.findOne({ username });
    if (user) {
      return {
        hasError: RegisterErrors.USERNAME_EXISTS,
      };
    }
    if (username.length <= 5 && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(username))
      return {
        hasError: RegisterErrors.USERNAME_INVALID,
      };
    const s = crypto.randomBytes(8).toString('hex');
    const { salt, passwordHash } = passwordSha512(password, s);
    let teamFromToken: string[] = [];
    if (invitationToken) {
      const tokenInfo = await o(InviteTokenCollection).collection.findOne({ token: invitationToken });
      if (tokenInfo) {
        if (Number(tokenInfo.expires) < Date.now()) {
          return {
            hasError: RegisterErrors.LINK_EXPIRED,
          };
        }
        if (!username.includes(tokenInfo.domain))
          return {
            hasError: RegisterErrors.INVITE_DOMAIN_INCORRECT,
          };
        if (tokenInfo.teamId) {
          teamFromToken = [tokenInfo.teamId];
        }
      }
    }
    const authorizationToken = crypto.pseudoRandomBytes(8).toString('hex');
    const insertedUser = await o(UserCollection).createWithAutoFields(
      '_id',
      'createdAt',
    )({
      ...rest,
      username,
      emailConfirmed: false,
      teams: teamFromToken,
    });
    try {
      if (teamFromToken.length !== 0)
        await o(TeamCollection).collection.updateOne(
          { _id: teamFromToken[0] },
          { $push: { members: insertedUser.insertedId } },
        );

      const res = await o(UserAuthorizationCollection).createWithAutoFields(
        '_id',
        'createdAt',
      )({
        username,
        salt,
        passwordHash,
        authorizationToken,
        userId: insertedUser.insertedId.toString(),
      });

      await MailgunWrapper()
        ?.send(formatVerifyEmail(username, authorizationToken))
        .then(() => true);
      return {
        response: {
          registered: res.insertedId.toString().length !== 0,
        },
        __meta: {
          createdUserId: insertedUser.insertedId,
        },
      };
    } catch (error) {
      await o(UserCollection).collection.deleteOne({ _id: insertedUser.insertedId });
      await o(UserAuthorizationCollection).collection.deleteOne({ userId: insertedUser.insertedId });
      throw error;
    }
  })(input.arguments);
