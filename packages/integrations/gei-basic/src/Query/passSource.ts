import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const passSource = async (input: FieldResolveInput) =>
  resolverFor('Query', 'passSource', async () => {
    return input.source;
  })(input.arguments);
export default passSource;
