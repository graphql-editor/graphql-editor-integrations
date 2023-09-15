import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'randomQuery', async (args) => {
    return 'this is random query';
  })(input.arguments);
