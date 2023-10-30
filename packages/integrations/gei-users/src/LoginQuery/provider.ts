import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const provider = async (input: FieldResolveInput) =>
  resolverFor('LoginQuery', 'provider', async (args) => {
    return {
      code: args.params.code,
    };
  })(input.arguments);
export default provider;
