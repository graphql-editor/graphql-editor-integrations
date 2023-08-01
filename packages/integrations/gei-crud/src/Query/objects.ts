import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) => {
  return DB().then((db) => {
    const fieldFilter = input.arguments?.fieldFilter ? input.arguments?.fieldFilter : input.arguments?.fieldRegexFilter ? {} : input.arguments
    const filterInput = {
      ...prepareSourceParameters(input),
      ...(fieldFilter as object),
      ...convertObjectToRegexFormat(input.arguments?.fieldRegexFilter as QueryObject),
    };
   const sort = (typeof input.arguments?.sortByField === 'object') ?  input.arguments?.sortByField as {field: string, order?: boolean}   : undefined
   const field = snakeCaseToCamelCase(sort?.field as unknown as string)

    return db.collection(prepareModel(input)).find(filterInput).sort(field ? { [field]: sort?.order === false ? -1 : 1 } : { _id: 1 }).toArray();
  });
};

interface QueryObject {
  [key: string]: unknown;
}


// Function to convert the object to the desired format
function convertObjectToRegexFormat(obj: QueryObject): QueryObject | undefined {
  const obj2: QueryObject = {};

  for (const key in obj) {
    if (obj[key]) obj2[key] = { $regex: obj[key], $options: 'i' };
  }
  return obj2 || {};
}


function snakeCaseToCamelCase(input:  string | null | undefined) {
  return input?.toLowerCase().replace(/_([a-z])/g, (match, group1) => group1.toUpperCase());
}
