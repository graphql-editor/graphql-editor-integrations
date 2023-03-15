import { FieldResolveInput } from 'stucco-js';
import { resolverFor, VerifyEmailError } from '../zeus/index.js';
import { UserAuthorizationCollection, UserCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'verifyEmail', async ({ verifyData: { token } }) => {
    const o = await orm();
    const userToAuthorize = await o(UserAuthorizationCollection).collection.findOne({
      authorizationToken: token,
    });
    if (!userToAuthorize) {
      return { hasError: VerifyEmailError.TOKEN_CANNOT_BE_FOUND };
    }
    await Promise.all([
      o(UserAuthorizationCollection).collection.updateOne(
        { userId: userToAuthorize.userId },
        { $unset: { authorizationToken: '' } },
      ),
      o(UserCollection).collection.updateOne({ _id: userToAuthorize.userId }, { $set: { emailConfirmed: true } }),
    ]);
    return { result: true };
  })(input.arguments);
