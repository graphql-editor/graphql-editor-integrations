import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepare_id, prepareSourceParameters, prepareRelatedField } from '../data.js';
import { DB } from '../db/orm.js';
import { ResolverInfoInput } from '../integration.js';
import { getResolverData } from '../shared.js';

export const handler = async (input: FieldResolveInput, info: ResolverInfoInput) => {
  const db = await DB();
  const model = info.model || prepareModel(input);

  const _id = prepare_id(input) || prepareSourceParameters(input, info.sourceParameters)._id;
  if (!_id) throw new Error('_id not found');

  const object = await db(model).collection.findOne({ _id });
  if (!object) {
    throw new Error('Object with this _id not found');
  }
  const s = object as Record<string, any>;
  const res = await db(model).collection.deleteOne({
    _id,
    ...prepareSourceParameters(input, info.sourceParameters),
  });
  if (!res.deletedCount) {
    throw new Error(
      `Object not found. Please check parameters: ${JSON.stringify({
        _id,
        ...prepareSourceParameters(input, info.sourceParameters),
      })}`,
    );
  }

  if (info.related) {
    for (const rel of info.related) {
      const relatedField = rel.relatedField?.split(':') || rel.relatedField?.split(':');
      if (relatedField) {
        const fieldForFounding = relatedField[0];
        const fieldWithIdOrArray = relatedField[1] || undefined;

        if (!fieldWithIdOrArray) {
          await db(rel.relatedModel).collection.updateMany({}, { $pull: { [fieldForFounding]: s._id } });
          await db(rel.relatedModel).collection.deleteMany({ [fieldForFounding]: s._id });
        } else if (!s[fieldWithIdOrArray]?.length) {
          return !!res.deletedCount;
        } else {
          if (typeof s[fieldWithIdOrArray] === 'string') {
            await db(rel.relatedModel).collection.updateMany(
              {},
              { $pull: { [fieldForFounding]: s[fieldWithIdOrArray] } },
            );
            await db(rel.relatedModel).collection.deleteMany({ [fieldForFounding]: s[fieldWithIdOrArray] });
          } else {
            await db(rel.relatedModel).collection.deleteMany({ [fieldForFounding]: { $in: s[fieldWithIdOrArray] } });
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
