import { FieldResolveInput } from 'stucco-js';
import { getEnv } from '../envGuard.js';
import { resolverFor } from '../zeus/index.js';

export const handler = (input: FieldResolveInput) =>
  resolverFor('Query', 'getGithubOAuthLink', ({ setup }) => {
    let authorizationUrl = 'https://github.com/login/oauth/authorize?scope=user:email%20read:user';
    if (Array.isArray(setup.scopes) && setup.scopes.length > 0) {
      setup.scopes.forEach((scope) => {
        authorizationUrl += '%20' + scope;
      });
    }
    return (
      authorizationUrl +
      `&client_id=${getEnv('GITHUB_APPLICATION_CLIENT_ID')}${setup.state ? '&state=' + setup.state : ``}&redirect_uri=${
        setup.redirectUri ? setup.redirectUri : getEnv('GITHUB_REDIRECT_URI')
      }`
    );
  })(input.arguments, input.source);
