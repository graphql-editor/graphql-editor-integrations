import { DataInput } from './../integration';
import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepareRequired_id, prepareSourceParameters } from '../data.js';
import { DB } from '../db/orm.js';

export const oneById = async (input: FieldResolveInput & Partial<DataInput>) =>
  DB().then(async (db) => {
    const { data } = input || {};
    const _id = prepareRequired_id(input);
    const filterInput = { _id, ...prepareSourceParameters({ data, ...input }) };
    return db(data?.model || prepareModel(input)).collection.findOne(filterInput);
  });

export default oneById;
