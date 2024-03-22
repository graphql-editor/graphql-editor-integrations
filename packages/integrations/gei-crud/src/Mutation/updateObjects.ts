import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareSourceParameters, createObjectFromAddFields } from '../data.js';
import { DB } from '../db/orm.js';
import { DataInput } from '../integration.js';
import { resolverFor } from '../zeus/index.js';

export const updateObjects = async (input: FieldResolveInput & Partial<DataInput>) =>
  resolverFor('Mutation', 'updateObjects', async (args) => 
  DB().then(async (db) => {
    const result = await Promise.all(args.objects?.map(async (update) => {
    const _id = update._id;
    if (!_id) throw new Error('_id not found');
    const entries = Object.entries(update);
    const reconstructedObject: Record<string, any> = {};

    const entriesWithOutId = entries.filter((e) => e[0] !== '_id');
    if (!entriesWithOutId) {
      throw new Error(`You need update input argument for this resolver to work`);
    }

    if (typeof entriesWithOutId[0][1] === 'object' && !Array.isArray(entriesWithOutId[0][1])) {
      if (entriesWithOutId[1])
        throw new Error(
          'There should be only string arguments or _id argument and one argument of "input" type to update this model',
        );
    } else {
      (entriesWithOutId as [string, any][]).forEach((entry: [string, any]) => {
        const [key, value] = entry;
        reconstructedObject[key] = value;
      });
    }

    const setter =
      typeof entriesWithOutId[0][1] === 'object' && !Array.isArray(entriesWithOutId[0][1])
        ? entriesWithOutId[0][1]
        : reconstructedObject;
    const filterInput: Record<string, any> = { _id, ...prepareSourceParameters(input) };
    const res = await db(input.data?.model || prepareModel(input)).collection.updateOne(filterInput, {
      $set: { ...setter,  ...(input.data?.addFields && createObjectFromAddFields(input.data.addFields)), updatedAt: new Date().toISOString() },
    });
    
    if (res.matchedCount < 1)
      throw new Error(`Object for update not found. Please check parameters: ${JSON.stringify(filterInput)}`);
    return res.modifiedCount >= 1;
  }))
    return result.filter((r)=> r === true).length > 0
  }))(input.arguments);

export default updateObjects;