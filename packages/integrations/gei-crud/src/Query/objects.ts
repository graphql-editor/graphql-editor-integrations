import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) => {
  return DB().then((db) => {
    const sortArg = input.arguments?.sortByField || input.arguments?.sort
    const sort = (typeof sortArg === 'object') ?  sortArg as {field: string, order?: boolean}   : undefined
    const field = snakeCaseToCamelCase(sort?.field as unknown as string)
    const fieldFilter = input.arguments?.fieldFilter 
    const fieldRegexFilter: any = input.arguments?.fieldRegexFilter ? input.arguments?.fieldRegexFilter :  fieldFilter ? {} : input.arguments
    if (fieldRegexFilter?.sortByField) delete fieldRegexFilter?.sortByField
    if (fieldRegexFilter?.sort) delete fieldRegexFilter?.sort
    const filterInput = {
      ...prepareSourceParameters(input),
      ...(ifValueIsArray(fieldFilter as QueryObject)),
      ...convertObjectToRegexFormat(fieldRegexFilter as QueryObject),
    };
   

    return db.collection(prepareModel(input)).find(filterInput).sort(field ? { [field]: sort?.order === false ? -1 : 1 } : { _id: 1 }).toArray();
  });
};

interface QueryObject {
  [key: string]: unknown;
}


// Function to convert the object to the desired format
function convertObjectToRegexFormat(obj: QueryObject): QueryObject | undefined {


  for (const key in obj) {
    if (Array.isArray(obj[key])) obj[key] = { $regex: { $in: obj[key]}, $options: 'i' }
    if (obj[key]&& typeof obj[key] === 'string' ) obj[key] = { $regex: obj[key], $options: 'i' };
  }
  return obj;
}


function ifValueIsArray(obj: QueryObject): QueryObject | undefined {
  for (const key in obj) {
    if (Array.isArray(obj[key]) ) obj[key] = { $in: obj[key]}
  }
  return obj;
}


function snakeCaseToCamelCase(input:  string | null | undefined) {
  return input?.toLowerCase().replace(/_([a-z])/g, (match, group1) => group1.toUpperCase());
}
