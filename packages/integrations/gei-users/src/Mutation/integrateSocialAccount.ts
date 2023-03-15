import { FieldResolveInput } from 'stucco-js';
import { comparePasswords, resolverForUser } from '../UserMiddleware.js';
import { SocialCollection, UserAuthorizationCollection, UserCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';
import { IntegrateSocialAccountError } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverForUser('Mutation', 'integrateSocialAccount', async ({ user, userData }) => {
    const o = await orm();
    const userInAuth = await o(UserAuthorizationCollection).collection.findOne({ username: userData.username });
    if (!userInAuth) return { hasError: IntegrateSocialAccountError.YOU_HAVE_ONLY_ONE_ACCOUNT };
    if (!userInAuth.passwordHash || !userInAuth.salt)
      return { hasError: IntegrateSocialAccountError.YOUR_ACCOUNT_DOES_NOT_HANDLE_CHANGE_PASSWORD_MODE };
    if (
      comparePasswords({
        password: userData.password,
        hash: userInAuth.passwordHash,
        salt: userInAuth.salt,
      })
    ) {
      return { hasError: IntegrateSocialAccountError.INCORRECT_PASSWORD };
    }
    const referUser = await o(UserCollection).collection.findOne({ _id: userInAuth.userId });
    if (!referUser) return { hasError: IntegrateSocialAccountError.CANNOT_FIND_USER };
    if (referUser.emailConfirmed === false)
      return { hasError: IntegrateSocialAccountError.YOUR_ACCOUNT_DOES_NOT_HAVE_CONFIRMED_EMAIL };
    await Promise.all([
      o(UserCollection).collection.deleteOne({ _id: user._id }),
      o(SocialCollection).collection.updateOne({ userId: user._id }, { $set: { userId: referUser._id } }),
    ]);
    return { result: true };
  })(input.arguments, input);
