
import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) => 
  resolverFor('UserMutation','randomMutation',async (args) => {
  })(input.arguments);
