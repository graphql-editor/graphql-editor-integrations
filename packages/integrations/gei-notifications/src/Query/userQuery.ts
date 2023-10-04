import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Query', 'userQuery', async (args) => ({
    userId: 'root',
  }))(input.arguments);
