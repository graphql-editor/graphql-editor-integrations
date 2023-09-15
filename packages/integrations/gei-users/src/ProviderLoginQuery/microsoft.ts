import { FieldResolveInput } from 'stucco-js';
import { orm } from '../db/orm.js';
import { getEnv } from '../envGuard.js';
import { ProviderErrors, resolverFor, SocialKind } from '../zeus/index.js';
import {
  addUserAndConnectSocial,
  getJwtAndRefreshToken,
  getMicrosoftUserInfo,
  ProviderLoginQuerySrc,
} from './shared.js';
import fetch from 'node-fetch';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('ProviderLoginQuery', 'microsoft', async (_, src: ProviderLoginQuerySrc) => {
    const o = await orm();

    const microsoftData = new URLSearchParams();
    microsoftData.append('code', src.code);
    microsoftData.append('grant_type', 'authorization_code');
    microsoftData.append('client_id', getEnv('MICROSOFT_APPLICATION_CLIENT_ID'));
    microsoftData.append('client_secret', getEnv('MICROSOFT_APPLICATION_CLIENT_SECRET'));
    microsoftData.append('redirect_uri', src?.redirectUri || getEnv('MICROSOFT_REDIRECT_URI'));

    const microsoftResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      body: microsoftData,
    }).then((response) => response.text());

    const { access_token } = JSON.parse(microsoftResponse);
    if (!access_token) return { hasError: ProviderErrors.CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT };
    const profile = await getMicrosoftUserInfo('https://graph.microsoft.com/v1.0/me', access_token);
    if (!profile) return { hasError: ProviderErrors.CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT };

    const { id, refreshTokenId, register } = await addUserAndConnectSocial({
      o,
      id: profile.id,
      username: profile.mail,
      social: SocialKind.Microsoft,
      fullName: profile.login || profile.displayName || profile.userPrincipalName,
      avatarUrl: profile.avatar_url,
    });

    const { jwtToken, refreshToken } = getJwtAndRefreshToken(id, refreshTokenId);

    return {
      response: {
        jwt: jwtToken,
        accessToken: jwtToken,
        providerAccessToken: access_token,
        refreshToken,
        register,
      },
      __meta: {
        profile,
      },
    };
  })(input.arguments, input.source);
