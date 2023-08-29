import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepare_id, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) =>
  DB().then(async (db) => {
    const _id = prepare_id(input) || (prepareSourceParameters(input)._id as string);
    if (!_id) throw new Error('_id not found');
    const entries = Object.entries(input.arguments || {});
    const reconstructedObject: Record<string, any> = {};
    
    const entriesWithOutId = entries.filter((e) => e[0] !== '_id');
    if (!entriesWithOutId) {
      throw new Error(`You need update input argument for this resolver to work`);
    }
    
    if (typeof entriesWithOutId[0][1] ==='object' ) {
      if(entriesWithOutId[1]) throw new Error(
        'There should be only string arguments or _id argument and one argument of "input" type to update this model',
      )
    } else{
      (entriesWithOutId  as [string, any][]).forEach((entry: [string, any]) => {
        const [key, value] = entry;
        reconstructedObject[key] = value;
      });
    }
    const setter = typeof entriesWithOutId[0][1] ==='object' ? entriesWithOutId[0][1] :  reconstructedObject
    const filterInput: Record<string, any> = { _id, ...prepareSourceParameters(input) };
    const res = await db
    .collection(prepareModel(input))
    .updateOne(filterInput, { $set: { ...(setter), updatedAt: new Date().toISOString() } })
    if(res.matchedCount<1) throw new Error(`Object for update not found. Please check parameters: ${ JSON.stringify(filterInput)}`)
    return res.modifiedCount>=1
  });
