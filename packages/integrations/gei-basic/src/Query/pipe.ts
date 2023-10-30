import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const pipe = async (input: FieldResolveInput) =>
  resolverFor('Query', 'pipe', async () => {
    return {};
  })(input.arguments);

export default pipe;
