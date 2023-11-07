import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const passSourceWithArgs = async (input: FieldResolveInput) =>
  resolverFor('Query', 'passSourceWithArgs', async (args, src) => {
    return { ...args, ...src };
  })(input.arguments, input.source);
export default passSourceWithArgs;
