import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepare_id, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) =>
  DB().then(async (db) => {
    const _id = prepare_id(input) || (prepareSourceParameters(input)._id as string);
    if (!_id) throw new Error('_id not found');
    const entries = Object.entries(input.arguments || {});
    if (entries.length !== 2 && entries.length !== 1) {
      throw new Error(
        'There should be only 2 arguments one "String" _id argument and one of "input" type to update this model',
      );
    }
    const setter = entries.find((e) => e[0] !== '_id');
    if (!setter) {
      throw new Error(`You need update input argument for this resolver to work`);
    }
    const filterInput: Record<string, any> = { _id, ...prepareSourceParameters(input) };
    const res = await db
    .collection(prepareModel(input))
    .updateOne(filterInput, { $set: { ...(setter[1] as object), updatedAt: new Date().toISOString() } })
    if(res.matchedCount<1) throw new Error('Object for update not found')
    return res.modifiedCount>=1
  });
