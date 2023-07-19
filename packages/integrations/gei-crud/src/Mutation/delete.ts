import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareRequired_id, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) =>
  DB().then((db) => {
    const _id = prepareRequired_id(input);
    return db
      .collection(prepareModel(input))
      .deleteOne({ _id, ...prepareSourceParameters(input) })
      .then((r) => !!r.deletedCount);
  });
