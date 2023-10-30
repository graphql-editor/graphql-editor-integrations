import { FieldResolveInput } from 'stucco-js';
import { prepareRelatedField, prepareRelatedModel } from '../data.js';
import { DB } from '../db/orm.js';
import { ResolverInfoInput } from '../integration.js';

export const oneToOne = async (input: FieldResolveInput, info: ResolverInfoInput) =>
  DB().then(async (db) => {
    const source = input.source;
    if (!source) {
      throw new Error(
        'Invalid input. This resolver work only if it is piped from other resolver. Either make it correct way or remove sourceParameters from resolver',
      );
    }
    const s = source as Record<string, any>;

    if (info.related) {
      const relateModel = info.related[0].model;
      const prepareField = info.related[0].field.split(':');
      const field = prepareField[0];
      const objectField = prepareField[1] ? prepareField[1] : undefined;
      if (objectField && typeof s[objectField] !== 'string') return objectField;
      return db(relateModel).collection.findOne({ [field]: objectField || s._id });
    }

    const prepareField = prepareRelatedField(input).replace(/[{ }]/g, '').split(':');
    const field = prepareField[0];
    const objectField = prepareField[1] ? prepareField[1] : undefined;
    if (objectField && typeof s[objectField] !== 'string') return objectField;
    return db(prepareRelatedModel(input)).collection.findOne({ [field]: objectField || s._id });
  });
export default oneToOne;
