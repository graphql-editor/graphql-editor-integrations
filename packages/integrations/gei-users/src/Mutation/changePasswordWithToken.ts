import { FieldResolveInput } from 'stucco-js';
import { ChangePasswordWithTokenError, resolverFor } from '../zeus/index.js';
import { orm } from '../db/orm.js';
import { UserAuthorizationCollection } from '../db/collections.js';
import { isPasswordEqualToSpecialParams } from './register.js';
import crypto from 'crypto';
import { passwordSha512 } from '../UserMiddleware.js';

export const changePasswordWithToken = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'changePasswordWithToken', async ({ token: { forgotToken, newPassword, username } }) => {
    const o = await orm();
    const findAuthUser = await o(UserAuthorizationCollection).collection.findOne({ username });
    if (!findAuthUser)
      return { hasError: ChangePasswordWithTokenError.CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL };
    if (findAuthUser.resetPasswordToken !== forgotToken)
      return { hasError: ChangePasswordWithTokenError.TOKEN_IS_INVALID };
    if (!isPasswordEqualToSpecialParams(newPassword))
      return { hasError: ChangePasswordWithTokenError.PASSWORD_IS_TOO_WEAK };
    const s = crypto.randomBytes(8).toString('hex');
    const { salt, passwordHash } = passwordSha512(newPassword, s);
    await o(UserAuthorizationCollection).collection.updateOne(
      { username },
      { $set: { salt, passwordHash }, $unset: { resetPasswordToken: '' } },
    );
    return { result: true };
  })(input.arguments);
export default changePasswordWithToken;
