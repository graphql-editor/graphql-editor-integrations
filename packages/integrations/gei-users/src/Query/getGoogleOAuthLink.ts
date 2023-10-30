import { FieldResolveInput } from 'stucco-js';
import { google } from 'googleapis';
import { getEnv } from '../envGuard.js';
import { resolverFor } from '../zeus/index.js';

export const getGoogleOAuthLink = (input: FieldResolveInput) =>
  resolverFor('Query', 'getGoogleOAuthLink', ({ setup }) => {
    const scopesWithPrefix = (setup.scopes || [])
      .filter((scope) => scope !== null && scope !== undefined)
      .map((scope) => `https://www.googleapis.com/auth/${scope}`);
    const allScopes = ['https://www.googleapis.com/auth/userinfo.email', ...scopesWithPrefix];

    const oauth2Client = new google.auth.OAuth2({
      clientId: getEnv('GOOGLE_CLIENT_ID'),
      redirectUri: setup.redirectUri ? setup.redirectUri : getEnv('GOOGLE_REDIRECT_URI'),
      clientSecret: getEnv('GOOGLE_SECRET_KEY'),
    });
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'online',
      scope: allScopes,
      include_granted_scopes: true,
      state: setup.state ? (setup.state as string) : ``,
    });
    return authorizationUrl;
  })(input.arguments, input.source);
export default getGoogleOAuthLink;
