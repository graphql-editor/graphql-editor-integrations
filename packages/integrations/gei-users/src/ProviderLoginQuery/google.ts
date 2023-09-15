import fetch from 'node-fetch';
import { FieldResolveInput } from 'stucco-js';
import { orm } from '../db/orm.js';
import { getEnv } from '../envGuard.js';
import { ProviderErrors, resolverFor, SocialKind } from '../zeus/index.js';
import { addUserAndConnectSocial, getJwtAndRefreshToken, getUserInfo, ProviderLoginQuerySrc } from './shared.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('ProviderLoginQuery', 'google', async (_, src: ProviderLoginQuerySrc) => {
    const o = await orm();
    const code = src.code.replace(/%2F/i, '/');

    const googleData = new URLSearchParams();
    googleData.append('code', code);
    googleData.append('client_id', getEnv('GOOGLE_CLIENT_ID'));
    googleData.append('client_secret', getEnv('GOOGLE_SECRET_KEY'));
    googleData.append('redirect_uri', src?.redirectUri || getEnv('GOOGLE_REDIRECT_URI'));
    googleData.append('grant_type', 'authorization_code');

    const googleResponse = await fetch('https://accounts.google.com/o/oauth2/token', {
      method: 'POST',
      body: googleData,
    }).then((response) => response.json() as Record<string, any>);
    if (!googleResponse) throw new Error('token not generated');

    const googleProfile = await getUserInfo(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      googleResponse.access_token,
    );
    if (!googleProfile.id) return { hasError: ProviderErrors.CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN };
    const { id, refreshTokenId, register } = await addUserAndConnectSocial({
      o,
      id: googleProfile.id,
      username: googleProfile.email,
      social: SocialKind.Google,
      fullName: googleProfile.login || googleProfile.name,
      avatarUrl: googleProfile.avatar_url || googleProfile.picture,
    });

    const { jwtToken, refreshToken } = getJwtAndRefreshToken(id, refreshTokenId);

    return {
      response: {
        jwt: jwtToken,
        accessToken: jwtToken,
        providerAccessToken: googleResponse.access_token,
        refreshToken,
        register,
      },
      __meta: {
        googleProfile,
        id,
      },
    };
  })(input.arguments, input.source);
