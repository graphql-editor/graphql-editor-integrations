import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareRequired_id, prepareSourceParameters } from '../data.js';
import { DB } from '../db/orm.js';
import { ResolverInfoInput } from '../integration.js';

export const handler = async (input: FieldResolveInput, info: ResolverInfoInput) =>
  DB().then(async (db) => {
    const _id = prepareRequired_id(input);
    const filterInput: Record<string, any> = { _id, ...prepareSourceParameters(input, info.sourceParameters) };
    return db(info.model || prepareModel(input)).collection.findOne(filterInput);
  });
