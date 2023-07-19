import { ObjectId, OptionalId } from 'mongodb';
import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';
import { getReturnTypeName } from '../shared.js';

export const handler = async (input: FieldResolveInput) =>
  DB().then((db) => {
    const rt = getReturnTypeName(input.info.returnType);
    if (rt !== 'String') {
      throw new Error('Create node field should have String return type.');
    }
    const entries = Object.entries(input.arguments || {});
    if (entries.length !== 1) {
      throw new Error('There should be only one argument of "input" type to create this model');
    }
    const creationInput = {
      ...(entries[0][1] as OptionalId<any>),
      ...prepareSourceParameters(input),
      _id: new ObjectId().toHexString(),
    };
    return db
      .collection(prepareModel(input))
      .insertOne(creationInput)
      .then((result) => result.insertedId);
  });
