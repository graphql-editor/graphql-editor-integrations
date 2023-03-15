import fs from 'fs';
import path from 'path';
import { FieldResolveInput } from 'stucco-js';

export const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'stucco.json'), 'utf-8')) as StuccoConfig;

export const getResolverData = (input: FieldResolveInput) => {
  const { parentType, fieldName } = input.info;
  const resolver = config.resolvers[`${parentType}.${fieldName}`];
  return resolver;
};
export interface StuccoConfig {
  resolvers: Resolvers;
}

export interface Resolvers {
  [x: `${string}.${string}`]: ResolverConfig;
}

export interface ResolverConfig {
  resolve: Resolve;
  data?: unknown;
}

export interface Resolve {
  name: string;
}
