import { FieldResolveInput } from 'stucco-js';
import { getEnv } from '../envGuard.js';
import { resolverFor } from '../zeus/index.js';

export const handler = (input: FieldResolveInput) =>
  resolverFor('Query', 'getAppleOAuthLink', ({ setup }): string => {
    const scopesWithPrefix = (setup.scopes || [])
      .filter((scope) => scope !== null && scope !== undefined)
      .map((scope) => `${scope}`);

    const allScopes = [...scopesWithPrefix];

    const authorizationUrl = `https://appleid.apple.com/auth/authorize?response_type=code&redirect_uri=${
      setup.redirectUri ? setup.redirectUri : getEnv('APPLE_REDIRECT_URI')
    }${setup.state ? '&state=' + setup.state : ``}&client_id=${getEnv('APPLE_CLIENT_ID')}&scope=${allScopes.join(' ')}`;
    return authorizationUrl;
  })(input.arguments, input.source);
