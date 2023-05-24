import fetch from 'node-fetch';
import { FieldResolveInput } from 'stucco-js';
import { orm } from '../db/orm.js';
import { getEnv } from '../envGuard.js';
import { ProviderErrors, resolverFor, SocialKind } from '../zeus/index.js';
import { addUserAndConnectSocial, getJwtAndRefreshToken, getUserInfo, ProviderLoginQuerySrc } from './shared.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('ProviderLoginQuery', 'github', async (_, src: ProviderLoginQuerySrc) => {
    const o = await orm();

    const githubData = new URLSearchParams();
    githubData.append('code', src.code);
    githubData.append('client_id', getEnv('GITHUB_APPLICATION_CLIENT_ID'));
    githubData.append('client_secret', getEnv('GITHUB_APPLICATION_CLIENT_SECRET'));
    githubData.append('redirect_uri', src?.redirectUri || getEnv('GITHUB_REDIRECT_URI'));

    const githubResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      body: githubData,
    }).then((response) => response.text());

    const github_access_token = githubResponse.split('&scope')[0].substring(13);
    const githubProfile = await getUserInfo('https://api.github.com/user', github_access_token);
    if (!githubProfile) return { hasError: ProviderErrors.CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN };

    const githubEmails = await getUserInfo('https://api.github.com/user/emails', github_access_token);
    if (!githubEmails.length) return { hasError: ProviderErrors.CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN };

    const primaryEmail = githubEmails.find(
      (email: { primary: boolean; email: string }) => email.primary === true,
    ).email;
    const email = githubProfile.email || primaryEmail;
    if (!email) return { hasError: ProviderErrors.CANNOT_FIND_EMAIL_FOR_THIS_PROFIL };
    const { id, refreshTokenId, register } = await addUserAndConnectSocial({
      o,
      id: githubProfile.id,
      username: email,
      social: SocialKind.Github,
    });

    const { jwtToken, refreshToken } = getJwtAndRefreshToken(id, refreshTokenId);

    return {
      response: {
        jwt: jwtToken,
        accessToken: jwtToken,
        providerAccessToken: github_access_token,
        refreshToken,
        register,
      },
      __meta: {
        githubProfile,
        id,
        email,
      },
    };
  })(input.arguments, input.source);
