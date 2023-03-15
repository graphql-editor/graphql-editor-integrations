import { JwtPayload } from 'jsonwebtoken';
import jwtDecode from 'jwt-decode';
import fetch from 'node-fetch';
import { FieldResolveInput } from 'stucco-js';
import { orm } from '../db/orm.js';
import { getEnv } from '../envGuard.js';
import { ProviderErrors, resolverFor, SocialKind } from '../zeus/index.js';
import { addUserAndConnectSocial, getJwtAndRefreshToken, ProviderLoginQuerySrc } from './shared.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('ProviderLoginQuery', 'apple', async (_, src: ProviderLoginQuerySrc) => {
    const o = await orm();
    if (!src.code) return { hasError: ProviderErrors.CODE_IS_NOT_EXIST_IN_ARGS };
    const appleData = new URLSearchParams();
    appleData.append('code', src.code);
    appleData.append('grant_type', 'authorization_code');
    appleData.append('redirect_uri', getEnv('APPLE_REDIRECT_URI'));
    appleData.append('client_secret', getEnv('APPLE_SECRET_KEY'));
    appleData.append('client_id', getEnv('APPLE_CLIENT_ID'));
    const appleResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      body: appleData,
    }).then((response) => response.json() as Record<string, any>);
    if (!appleResponse || !appleResponse.id_token)
      return { hasError: ProviderErrors.CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE };
    const appleProfile = jwtDecode<JwtPayload>(appleResponse.id_token);
    if (!appleProfile.sub) return { hasError: ProviderErrors.CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN };
    //if (!appleProfile.email) return { hasError: ProviderErrors.NOT_VERIFIED_EMAIL_IN_APPLE_PROFILE };
    const { id, refreshTokenId, register } = await addUserAndConnectSocial({
      o,
      id: appleProfile.sub,
      username: appleProfile.email || 'AppleHideProfile_' + appleProfile.sub.slice(0, 6),
      social: SocialKind.Apple,
    });

    const { jwtToken, refreshToken } = getJwtAndRefreshToken(id, refreshTokenId);

    return {
      response: {
        jwt: jwtToken,
        accessToken: jwtToken,
        providerAccessToken: appleResponse.id_token,
        refreshToken,
        register,
      },
      __meta: {
        appleProfile,
        id,
      },
    };
  })(input.arguments, input.source);
