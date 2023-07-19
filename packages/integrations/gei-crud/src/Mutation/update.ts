import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareRequired_id, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) =>
  DB().then((db) => {
    const _id = prepareRequired_id(input);
    const entries = Object.entries(input.arguments || {});
    if (entries.length !== 2) {
      throw new Error(
        'There should be only 2 arguments one "String" _id argument and one of "input" type to update this model',
      );
    }
    const setter = entries.find((e) => e[0] !== '_id');
    if (!setter) {
      throw new Error(`You need update input argument for this resolver to work`);
    }
    const filterInput: Record<string, any> = { _id, ...prepareSourceParameters(input) };
    return db
      .collection(prepareModel(input))
      .updateOne(filterInput, { $set: setter[1] })
      .then((r) => !!r.modifiedCount);
  });
