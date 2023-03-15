import { FieldResolveInput } from 'stucco-js';
import { SocialKind, resolverFor, GenerateOAuthTokenError } from '../zeus/index.js';
import { getEnv } from '../envGuard.js';
import fetch from 'node-fetch';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'generateOAuthToken', async ({ tokenData: { social, code } }) => {
    switch (social) {
      case SocialKind.Google:
        const googleData = new URLSearchParams();
        googleData.append('code', code);
        googleData.append('client_id', getEnv('GOOGLE_CLIENT_ID'));
        googleData.append('client_secret', getEnv('GOOGLE_SECRET_KEY'));
        googleData.append('redirect_uri', getEnv('GOOGLE_REDIRECT_URI'));
        googleData.append('grant_type', 'authorization_code');
        const googleResponse = await fetch('https://accounts.google.com/o/oauth2/token', {
          method: 'POST',
          body: googleData,
        }).then((response) => response.json() as Record<string, any>);
        if (!googleResponse) return { hasError: GenerateOAuthTokenError.TOKEN_NOT_GENERATED };
        return { result: googleResponse.access_token };
      case SocialKind.Github:
        const githubData = new URLSearchParams();
        githubData.append('code', code);
        githubData.append('client_id', getEnv('GITHUB_APPLICATION_CLIENT_ID'));
        githubData.append('client_secret', getEnv('GITHUB_APPLICATION_CLIENT_SECRET'));
        githubData.append('redirect_uri', getEnv('GITHUB_REDIRECT_URI'));
        const githubResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          body: githubData,
        }).then((response) => response.text());
        const githubToken = githubResponse.split('&scope')[0].substring(13);
        return { result: githubToken };
      case SocialKind.Apple:
        const appleData = new URLSearchParams();
        appleData.append('code', code);
        appleData.append('grant_type', 'authorization_code');
        appleData.append('redirect_uri', getEnv('APPLE_REDIRECT_URI'));
        appleData.append('client_secret', getEnv('APPLE_SECRET_KEY'));
        appleData.append('client_id', getEnv('APPLE_CLIENT_ID'));
        const appleResponse = (await fetch('https://appleid.apple.com/auth/token', {
          method: 'POST',
          body: appleData,
        }).then((response) => response.json())) as Record<string, any>;
        if (!appleResponse || !appleResponse.id_token)
          return { hasError: GenerateOAuthTokenError.CANNOT_RETRIEVE_USER_INFORMATION_FROM_APPLE };
        return { result: appleResponse.access_token };
    }
  })(input.arguments);
