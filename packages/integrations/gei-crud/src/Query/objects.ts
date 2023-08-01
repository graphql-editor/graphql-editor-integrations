import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareSourceParameters } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) => {
  return DB().then((db) => {
    const filterInput = {
      ...prepareSourceParameters(input),
      ...(input.arguments?.fieldFilter as object),
      ...convertObjectToRegexFormat(input.arguments?.fieldFilterReg as QueryObject),
    };
   const sort: {field: string, order: boolean} = input.arguments?.sortByField
    
  
    return db.collection(prepareModel(input)).find(filterInput).sort(sort?.field ? { [snakeCaseToCamelCase(sort.field)]: sort.order === false ? -1 : 1 } : { _id: 1 }).toArray();
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


function snakeCaseToCamelCase(input: string | null | undefined) {
  return input?.toLowerCase().replace(/_([a-z])/g, (match, group1) => group1.toUpperCase());
}
