import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareSourceParameters } from '../data.js';
import { DB } from '../db/orm.js';
import { DataInput } from '../integration.js';
import { QueryObject, checkStringFields, ifValueIsArray, snakeCaseToCamelCase, convertDateFilter, convertObjectToRegexFormat } from '../utils.js';

export const objects = async (input: FieldResolveInput & Partial<DataInput>) => {
  return DB().then((db) => {
    const sortArg = input.arguments?.sortByField || input.arguments?.sort;
    const sort = typeof sortArg === 'object' ? (sortArg as { field: string; order?: boolean }) : undefined;
    const field = snakeCaseToCamelCase(sort?.field as unknown as string);
    const fieldFilter = input.arguments?.fieldFilter;
    const dateFilter = input.arguments?.dateFilter;
    const fieldRegexFilter: any = input.arguments?.fieldRegexFilter
      ? input.arguments?.fieldRegexFilter
      : fieldFilter
      ? {}
      : checkStringFields(input.arguments)
      ? input.arguments
      : {};
    if (fieldRegexFilter?.sortByField) delete fieldRegexFilter?.sortByField;
    if (fieldRegexFilter?.sort) delete fieldRegexFilter?.sort;
    if (fieldRegexFilter?.dateFilter) delete fieldRegexFilter?.dateFilter;
    const filterInput = {
      ...prepareSourceParameters(input),
      ...convertDateFilter(dateFilter as QueryObject),
      ...ifValueIsArray(fieldFilter as QueryObject),
      ...convertObjectToRegexFormat(ifValueIsArray(fieldRegexFilter) as QueryObject),
    };

    return db(input.data?.model || prepareModel(input))
      .collection.find(filterInput)
      .sort(field ? { [field]: sort?.order === false ? -1 : 1 } : { _id: 1 })
      .toArray();
  });
};
export default objects;
