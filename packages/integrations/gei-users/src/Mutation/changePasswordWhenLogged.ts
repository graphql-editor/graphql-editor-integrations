import { FieldResolveInput } from 'stucco-js';
import { comparePasswords, passwordSha512 } from '../UserMiddleware.js';
import crypto from 'crypto';
import { UserAuthorizationCollection } from '../db/collections.js';
import { isPasswordEqualToSpecialParams } from './register.js';
import { ChangePasswordWhenLoggedError, resolverFor } from '../zeus/index.js';
import { orm } from '../db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor(
    'Mutation',
    'changePasswordWhenLogged',
    async ({ changePasswordData: { username, newPassword, oldPassword } }) => {
      const o = await orm();
      const findAuthUser = await o(UserAuthorizationCollection).collection.findOne({ username });
      if (!findAuthUser)
        return { hasError: ChangePasswordWhenLoggedError.CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL };
      const passwordMatch = comparePasswords({
        password: oldPassword,
        hash: findAuthUser.passwordHash || '',
        salt: findAuthUser.salt || '',
      });
      if (!passwordMatch) return { hasError: ChangePasswordWhenLoggedError.OLD_PASSWORD_IS_INVALID };
      if (!isPasswordEqualToSpecialParams(newPassword))
        return { hasError: ChangePasswordWhenLoggedError.PASSWORD_WEAK };
      const s = crypto.randomBytes(8).toString('hex');
      const { salt, passwordHash } = passwordSha512(newPassword, s);
      await o(UserAuthorizationCollection).collection.updateOne({ username }, { $set: { salt, passwordHash } });
      return { result: true };
    },
  )(input.arguments);
