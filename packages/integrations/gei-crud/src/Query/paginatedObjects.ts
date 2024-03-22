import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareSourceParameters } from '../data.js';
import { DB } from '../db/orm.js';
import { DataInput } from '../integration.js';
import { SortDirection } from 'mongodb';
import { QueryObject, checkStringFields, getPaginationOpts, ifValueIsArray, paginateObjects, preparedSort, skipCursorForSortByField, convertObjectToRegexFormat, convertDateFilter } from '../utils.js';

export const paginatedObjects = async (input: FieldResolveInput & Partial<DataInput>) => {
    const paginate = getPaginationOpts(input.arguments?.paginate || input.data?.paginate)
    const db = await DB()
    const sortArg = input.arguments?.sortByField || input.arguments?.sort || input.data?.sort;
   
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

    const objects = await db(input.data?.model || prepareModel(input))
      .collection.find(filterInput, 
        { 
            sort: preparedSort(sortArg),
            ...(paginate?.limit && { limit: paginate?.limit }),
            ...((sortArg as [string, SortDirection])[0] !== '_id' && paginate?.cursorId && { skip: parseInt(paginate?.cursorId) })
         }
    )
      .toArray();

    return paginateObjects(objects, paginate.limit, 'objects', skipCursorForSortByField(input.data || input.arguments))
  }

  export default paginatedObjects;