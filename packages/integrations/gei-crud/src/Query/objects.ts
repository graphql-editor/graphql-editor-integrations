import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) => {
  return DB().then((db) => {
    const filterInput = {
      ...prepareSourceParameters(input),
    };
    return db.collection(prepareModel(input)).find(filterInput).toArray();
  });
};
