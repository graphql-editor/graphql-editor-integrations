import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepare_id, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) =>
  DB().then((db) => {
    const _id = prepare_id(input) || prepareSourceParameters(input)._id;
    if (!_id) throw new Error('_id not found');
    return db
      .collection(prepareModel(input))
      .deleteOne({ _id, ...prepareSourceParameters(input) })
      .then((r) => !!r.deletedCount);
  });
