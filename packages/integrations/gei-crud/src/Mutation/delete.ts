import { FieldResolveInput } from 'stucco-js';
import {
  prepareModel,
  prepare_id,
  prepareSourceParameters,
  prepareRelatedField,
  prepareRelatedModel,
} from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) => {
  const db = await DB();

  const _id = prepare_id(input) || prepareSourceParameters(input)._id;
  if (!_id) throw new Error('_id not found');

  const object = await db.collection(prepareModel(input)).findOne({ _id });
  if (!object) {
    throw new Error('Object with this _id not found');
  }

  const res = await db.collection(prepareModel(input)).deleteOne({ _id, ...prepareSourceParameters(input) });
  if (!res.deletedCount) {
    throw new Error(
      `Object not found. Please check parameters: ${JSON.stringify({ _id, ...prepareSourceParameters(input) })}`,
    );
  }

  const s = object as Record<string, any>;

  const relatedCollections = prepareRelatedModel(input).replace(/["' ]/g, '').split(',');
  const prepareFields = prepareRelatedField(input)?.replace(/[{ }]/g, '').split(',');
  let i = 0;
  for (const rC of relatedCollections) {
    const prepareField = prepareFields[i]?.split(':') || prepareFields[0]?.split(':');
    i++;
    if (prepareField) {
      const fieldForFounding = prepareField[0];
      const fieldWithIdOrArray = prepareField[1] || undefined;

      if (!fieldWithIdOrArray) {
        await db.collection(rC).updateMany({}, { $pull: { [fieldForFounding]: s._id } });
        await db.collection(rC).deleteMany({ [fieldForFounding]: s._id });
      } else if (!s[fieldWithIdOrArray]?.length) {
        return !!res.deletedCount;
      } else {
        if (typeof s[fieldWithIdOrArray] === 'string') {
          await db.collection(rC).updateMany({}, { $pull: { [fieldForFounding]: s[fieldWithIdOrArray] } });
          await db.collection(rC).deleteMany({ [fieldForFounding]: s[fieldWithIdOrArray] });
        } else {
          await db.collection(rC).deleteMany({ [fieldForFounding]: { $in: s[fieldWithIdOrArray] } });
        }
      }
    }
  }
  return !!res.deletedCount;
};
