import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareRequired_id, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) =>
  DB().then(async (db) => {
    const _id = prepareRequired_id(input);
    const filterInput: Record<string, any> = { _id, ...prepareSourceParameters(input) };
    return db.collection(prepareModel(input)).findOne(filterInput);
  });
