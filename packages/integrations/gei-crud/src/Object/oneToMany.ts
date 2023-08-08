import { FieldResolveInput } from 'stucco-js';
import { prepareRelatedField, prepareRelatedModel } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) =>
  DB().then(async (db) => {
    const source = input.source;
    if (!source) {
      throw new Error(
        'Invalid input. This resolver work only if it is piped from other resolver. Either make it correct way or remove sourceParameters from resolver',
      );
    }
  
    const s = source as Record<string, any>;
    const prepareField = prepareRelatedField(input).replace(/[{ }]/g, '').split(":");
    const fieldForFounding = prepareField[0];
    const fieldWithArray = prepareField[1] ? prepareField[1]  : undefined
    if(fieldWithArray&&!s[fieldWithArray]?.length) return null
    return db
      .collection(prepareRelatedModel(input))
      .find( { [fieldForFounding]: (fieldWithArray? { $in: s[fieldWithArray]} :  s._id )}).toArray()
  });
