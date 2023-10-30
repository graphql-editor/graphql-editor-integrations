import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepare_id, prepareSourceParameters, prepareRelatedField } from '../data.js';
import { DB } from '../db/orm.js';
import { DataInput } from '../integration.js';
import { getResolverData } from '../shared.js';

export const deleteById = async (input: FieldResolveInput & Partial<DataInput>) => {
  const db = await DB();
  const model = input.data?.model || prepareModel(input);

  const _id = prepare_id(input) || prepareSourceParameters(input)._id;
  if (!_id) throw new Error('_id not found');

  const object = await db(model).collection.findOne({ _id });
  if (!object) {
    throw new Error('Object with this _id not found');
  }
  const s = object as Record<string, any>;
  const res = await db(model).collection.deleteOne({
    _id,
    ...prepareSourceParameters(input),
  });
  if (!res.deletedCount) {
    throw new Error(
      `Object not found. Please check parameters: ${JSON.stringify({
        _id,
        ...prepareSourceParameters(input),
      })}`,
    );
  }

  if (input.data?.related) {
    for (const rel of input.data.related) {
      const relatedField = rel.field?.split(':') || rel.field?.split(':');
      if (relatedField) {
        const fieldForFounding = relatedField[0];
        const fieldWithIdOrArray = relatedField[1] || undefined;

        if (!fieldWithIdOrArray) {
          await db(rel.model).collection.updateMany({}, { $pull: { [fieldForFounding]: s._id } });
          await db(rel.model).collection.deleteMany({ [fieldForFounding]: s._id });
        } else if (!s[fieldWithIdOrArray]?.length) {
          return !!res.deletedCount;
        } else {
          if (typeof s[fieldWithIdOrArray] === 'string') {
            await db(rel.model).collection.updateMany({}, { $pull: { [fieldForFounding]: s[fieldWithIdOrArray] } });
            await db(rel.model).collection.deleteMany({ [fieldForFounding]: s[fieldWithIdOrArray] });
          } else {
            await db(rel.model).collection.deleteMany({ [fieldForFounding]: { $in: s[fieldWithIdOrArray] } });
          }
        }
      }
    }
    return !!res.deletedCount;
  }

  const { data } = getResolverData<{ relatedModel: string }>(input);
  const relatedCollectionsField = data?.relatedModel?.value;

  if (relatedCollectionsField && relatedCollectionsField?.length > 2) {
    const s = object as Record<string, any>;
    const relatedCollections = relatedCollectionsField.replace(/["' ]/g, '').split(',');
    const relatedFields = prepareRelatedField(input)?.replace(/[{ }]/g, '').split(',');
    let i = 0;
    for (const rC of relatedCollections) {
      const relatedField = relatedFields[i]?.split(':') || relatedFields[0]?.split(':');
      i++;
      if (relatedField) {
        const fieldForFounding = relatedField[0];
        const fieldWithIdOrArray = relatedField[1] || undefined;

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
export default deleteById;
