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
    const field = prepareRelatedField(input);
    return db.collection(prepareRelatedModel(input)).findOne({ [field]: s._id });
  });
