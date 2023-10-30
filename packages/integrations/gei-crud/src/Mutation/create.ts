import { ObjectId, OptionalId } from 'mongodb';
import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareSourceParameters } from '../data.js';
import { DB } from '../db/orm.js';
import { ResolverInfoInput } from '../integration.js';
import { getReturnTypeName } from '../shared.js';

export const create = async (input: FieldResolveInput, info: ResolverInfoInput) =>
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
      ...(info.addFields && createObjectFromAddFields(info.addFields)),
      ...prepareSourceParameters(input, info.sourceParameters),
      _id: new ObjectId().toHexString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return db(info.model || prepareModel(input))
      .collection.insertOne(creationInput)
      .then((result) => result.insertedId);
  });

function createObjectFromAddFields(addFieldsArray: { name: string; value: unknown }[]) {
  const result: { [key: string]: unknown } = {};

  for (const field of addFieldsArray) {
    const { name, value } = field;
    result[name] = value;
  }

  return result;
}
export default create;
