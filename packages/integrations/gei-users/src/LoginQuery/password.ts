import { FieldResolveInput } from 'stucco-js';
import { RefreshTokenCollection, UserAuthorizationCollection, UserCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';
import { getJwtAndRefreshToken } from '../ProviderLoginQuery/shared.js';
import { comparePasswords } from '../UserMiddleware.js';
import { LoginErrors, resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('LoginQuery', 'password', async (args) => {
    const o = await orm();
    if (!args.user.password || !args.user.username) return { hasError: LoginErrors.INVALID_LOGIN_OR_PASSWORD };
    const [userAuth, user] = await Promise.all([
      await o(UserAuthorizationCollection).collection.findOne({ username: args.user.username }),
      await o(UserCollection).collection.findOne({ username: args.user.username }),
    ]);
    if (!userAuth && user) {
      return { hasError: LoginErrors.YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL };
    }
    if (!userAuth) {
      return { hasError: LoginErrors.INVALID_LOGIN_OR_PASSWORD };
    }
    if (!user) return { hasError: LoginErrors.CANNOT_FIND_CONNECTED_USER };

    const refreshTokenId = (
      await o(RefreshTokenCollection).createWithAutoFields('_id')({
        userId: user._id,
      })
    ).insertedId;
    const { jwtToken, refreshToken } = getJwtAndRefreshToken(userAuth.userId, refreshTokenId);

    if (userAuth.passwordHash && userAuth.salt) {
      const passwordMatch = comparePasswords({
        password: args.user.password,
        hash: userAuth.passwordHash,
        salt: userAuth.salt,
      });
      if (!passwordMatch) {
        return { hasError: LoginErrors.INVALID_LOGIN_OR_PASSWORD };
      }
      if (user.emailConfirmed === false) return { hasError: LoginErrors.CONFIRM_EMAIL_BEFOR_LOGIN };
      return {
        response: { login: jwtToken, accessToken: jwtToken, refreshToken },
        __meta: {
          user: user,
        },
      };
    }
    if (userAuth.password) {
      if (userAuth.password !== args.user.password) {
        return { hasError: LoginErrors.INVALID_LOGIN_OR_PASSWORD };
      }
      if (user.emailConfirmed === false) return { hasError: LoginErrors.CONFIRM_EMAIL_BEFOR_LOGIN };

      return {
        response: {
          login: jwtToken,
          accessToken: jwtToken,
          refreshToken,
        },
        __meta: {
          user: user,
        },
      };
    }
  })(input.arguments);
