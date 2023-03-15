import { FieldResolveInput } from 'stucco-js';
import { getEnv } from '../envGuard.js';
import { resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Query', 'getMicrosoftOAuthLink', async ({ setup }) => {
    let scopes = `&scope=openid%20profile%20email%20https%3A%2F%2Fgraph.microsoft.com%2Fuser.read`;
    if (Array.isArray(setup.scopes) && setup.scopes.length > 0) {
      setup.scopes.forEach((scope) => {
        scopes += '%20' + scope;
      });
    }

    const authUrl =
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' +
      `client_id=${getEnv('MICROSOFT_APPLICATION_CLIENT_ID')}` +
      `&response_type=code` +
      `&redirect_uri=${getEnv('MICROSOFT_REDIRECT_URI')}` +
      scopes +
      (setup.state ? '&state=' + setup.state : ``);
    return authUrl;
  })(input.arguments);
