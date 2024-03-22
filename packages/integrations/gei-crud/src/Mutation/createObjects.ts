import { ObjectId } from 'mongodb';
import { FieldResolveInput } from 'stucco-js';
import { createObjectFromAddFields, prepareModel, prepareSourceParameters } from '../data.js';
import { DB } from '../db/orm.js';
import { DataInput } from '../integration.js';
import { getReturnTypeName } from '../shared.js';
import { resolverFor } from '../zeus/index.js';

export const createObjects = async (input: FieldResolveInput & Partial<DataInput>) =>
  resolverFor('Mutation', 'createObjects', async (args) => 
  DB().then(async (db) => {
    const rt = getReturnTypeName(input.info.returnType);
    const sourceParameters = prepareSourceParameters(input)
    const addFields = input.data?.addFields ? createObjectFromAddFields(input.data?.addFields) : undefined
   
    let objectsToUpdate: any[] = [];

    for (const key in args) {
      if (Array.isArray((args as any)[key])) {
        objectsToUpdate = (args as any)[key];
        break; 
      }
    }
   
    const objects = objectsToUpdate?.map(async (object) => {
   
    return {
      ...object,
      ...addFields,
      ...sourceParameters,
      _id: new ObjectId().toHexString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  })
   
    const result = await db(args.collectionName || input.data?.model || prepareModel(input))
      .collection.insertMany(objects)
      return rt === 'String' ? `Created ${result?.insertedCount} objects` : rt === 'Object' ? result.insertedIds : result.insertedCount > 0
  }))(input.arguments);


export default createObjects;
