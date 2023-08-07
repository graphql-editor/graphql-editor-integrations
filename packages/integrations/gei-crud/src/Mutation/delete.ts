import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepare_id, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) =>
  DB().then(async (db) => {
    const _id = prepare_id(input) || prepareSourceParameters(input)._id;
    if (!_id) throw new Error('_id not found');
    const res = await db
      .collection(prepareModel(input))
      .deleteOne({ _id, ...prepareSourceParameters(input) })
    if(res.deletedCount) throw new Error(`Object not found. Please check parameters: ${{ _id, ...prepareSourceParameters(input) }}`)
    return !!res.deletedCount
  });
