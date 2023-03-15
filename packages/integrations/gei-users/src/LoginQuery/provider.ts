import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('LoginQuery', 'provider', async (args) => {
    return {
      code: args.params.code,
    };
  })(input.arguments);
