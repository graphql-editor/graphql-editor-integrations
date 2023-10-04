import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'listChannels', async (args, src) => {
    return src.userId;
  })(input.arguments, input.source);
