import { FieldResolveInput } from 'stucco-js';
import { prepareRelatedField, prepareRelatedModel } from '../data.js';
import { DB } from '../db/orm.js';
import { DataInput } from '../integration.js';

export const oneToMany = async (input: FieldResolveInput & Partial<DataInput>) => {
  return DB().then(async (db) => {
    const source = input.source;

    if (!source) {
      throw new Error(
        'Invalid input. This resolver works only if it is piped from another resolver. Either set it up correctly or remove sourceParameters from resolver',
      );
    }

    const s = source as Record<string, any>;

    if (input.data?.related) {
      const relateModel = input.data.related[0].model;
      const prepareField = input.data.related[0].field.split(':');
      const fieldForFounding = prepareField[0];
      const fieldWithArray = prepareField[1] ? prepareField[1] : undefined;

      if (fieldWithArray) {
        // Return an empty array if the fieldWithArray is either not an array or an empty array.
        if (!Array.isArray(s[fieldWithArray]) || s[fieldWithArray].length === 0) {
          return [];
        }
        if (typeof s[fieldWithArray][0] !== 'string') {
          return s[fieldWithArray].filter((s: any) => s !== null);
        }
      }

      return db(relateModel)
        .collection.find({
          [fieldForFounding]: fieldWithArray ? { $in: s[fieldWithArray] } : s._id,
        })
        .toArray();
    }

    const prepareField = prepareRelatedField(input).replace(/[{ }]/g, '').split(':');
    const fieldForFounding = prepareField[0];
    const fieldWithArray = prepareField[1] ? prepareField[1] : undefined;

    if (fieldWithArray) {
      // Return an empty array if the fieldWithArray is either not an array or an empty array.
      if (!Array.isArray(s[fieldWithArray]) || s[fieldWithArray].length === 0) {
        return [];
      }
      if (typeof s[fieldWithArray][0] !== 'string') {
        return s[fieldWithArray].filter((s: any) => s !== null);
      }
    }

    return db(prepareRelatedModel(input))
      .collection.find({
        [fieldForFounding]: fieldWithArray ? { $in: s[fieldWithArray] } : s._id,
      })
      .toArray();
  });
};
export default oneToMany;
