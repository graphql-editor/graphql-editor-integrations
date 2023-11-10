import { ObjectId, OptionalId } from 'mongodb';
import { FieldResolveInput } from 'stucco-js';
import { createObjectFromAddFields, prepareModel, prepareSourceParameters } from '../data.js';
import { DB } from '../db/orm.js';
import { DataInput } from '../integration.js';
import { getReturnTypeName } from '../shared.js';

export const create = async (input: FieldResolveInput & Partial<DataInput>) =>
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
      ...(input.data?.addFields && createObjectFromAddFields(input.data.addFields)),
      ...prepareSourceParameters(input),
      _id: new ObjectId().toHexString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return db(input.data?.model || prepareModel(input))
      .collection.insertOne(creationInput)
      .then((result) => result.insertedId);
  });


export default create;
