import pkg from 'jsonwebtoken';
const { sign } = pkg;
import { FieldResolveInput } from 'stucco-js';
import { RefreshTokenCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';
import { getEnv } from '../envGuard.js';
import { decodeRefreshToken } from '../UserMiddleware.js';
import { resolverFor } from '../zeus/index.js';

export const refreshToken = async (input: FieldResolveInput) =>
  resolverFor('LoginQuery', 'refreshToken', async ({ refreshToken }) => {
    const o = await orm();
    const { sub, tokenId } = decodeRefreshToken(refreshToken);
    const refreshTokenObject = await o(RefreshTokenCollection).collection.findOne({ _id: tokenId, userId: sub });
    if (!refreshTokenObject) throw new Error('Invalid token');

    const JWT_TOKEN_EXPIRATION_IN_SECONDS = process.env['JWT_TOKEN_EXPIRATION_IN_SECONDS'];
    const expiresIn = JWT_TOKEN_EXPIRATION_IN_SECONDS ? parseInt(JWT_TOKEN_EXPIRATION_IN_SECONDS) : 60 * 60 * 24;
    const jwtSecret = getEnv('JWT_SECRET');

    return {
      response: sign({ userId: refreshTokenObject.userId }, jwtSecret, { expiresIn }),
    };
  })(input.arguments);
export default refreshToken;
