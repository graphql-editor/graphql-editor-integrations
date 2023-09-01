import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepare_id, prepareSourceParameters, prepareRelatedField } from '../data.js';
import { DB } from '../db/orm.js';
import { getResolverData } from '../shared.js';

export const handler = async (input: FieldResolveInput) => {
  const db = await DB();

  const _id = prepare_id(input) || prepareSourceParameters(input)._id;
  if (!_id) throw new Error('_id not found');

  const object = await db(prepareModel(input)).collection.findOne({ _id });
  if (!object) {
    throw new Error('Object with this _id not found');
  }

  const res = await db(prepareModel(input)).collection.deleteOne({ _id, ...prepareSourceParameters(input) });
  if (!res.deletedCount) {
    throw new Error(
      `Object not found. Please check parameters: ${JSON.stringify({ _id, ...prepareSourceParameters(input) })}`,
    );
  }

  const { data } = getResolverData<{ relatedModel: string }>(input);
  const relatedCollectionsField = data?.relatedModel?.value;
  console.log(relatedCollectionsField?.length);
  console.log(relatedCollectionsField);

  if (relatedCollectionsField && relatedCollectionsField?.length > 2) {
    console.log('kkdlckm');
    const s = object as Record<string, any>;
    const relatedCollections = relatedCollectionsField.replace(/["' ]/g, '').split(',');
    const prepareFields = prepareRelatedField(input)?.replace(/[{ }]/g, '').split(',');
    let i = 0;
    for (const rC of relatedCollections) {
      const prepareField = prepareFields[i]?.split(':') || prepareFields[0]?.split(':');
      i++;
      if (prepareField) {
        const fieldForFounding = prepareField[0];
        const fieldWithIdOrArray = prepareField[1] || undefined;

        if (!fieldWithIdOrArray) {
          await db(rC).collection.updateMany({}, { $pull: { [fieldForFounding]: s._id } });
          await db(rC).collection.deleteMany({ [fieldForFounding]: s._id });
        } else if (!s[fieldWithIdOrArray]?.length) {
          return !!res.deletedCount;
        } else {
          if (typeof s[fieldWithIdOrArray] === 'string') {
            await db(rC).collection.updateMany({}, { $pull: { [fieldForFounding]: s[fieldWithIdOrArray] } });
            await db(rC).collection.deleteMany({ [fieldForFounding]: s[fieldWithIdOrArray] });
          } else {
            await db(rC).collection.deleteMany({ [fieldForFounding]: { $in: s[fieldWithIdOrArray] } });
          }
        }
      }
    }
  }
  return !!res.deletedCount;
};
