import { iGraphQL } from 'i-graphql';
import { ObjectId } from 'mongodb';
import { Models } from '../../models/index.js';
import { GlobalError } from '../middleware.js';

export const orm = async () => {
  return iGraphQL<
    {
      Services: Models['ServiceModel'];
      Bookings: Models['BookingRecordModel'];
    },
    {
      _id: () => string;
      createdAt: () => Date;
    }
  >(
    {
      _id: () => new ObjectId().toHexString(),
      createdAt: () => new Date(),
    },
    async (db) => {
      return Promise.all([
        db.createIndex('Services', { ownerId: 1 }),
      ]);
    },
  );
};

export const MongoOrb = await orm();

export const mustFindOne = async (col: 'Services' | 'Bookings', filter: {}, options: {} | null = null) => {
  return orm().then((o) =>
    o(col)
      .collection.findOne(filter, options ? options : {})
      .catch(() => {
        throw new GlobalError('mustFindOne returns null', import.meta.url);
      }),
  );
};

export const mustFindAny = async (
  col: 'Services' | 'Bookings',
  filter: {} | null = null,
  options: {} | null = null,
) => {
  return await orm().then((o) =>
    o(col)
      .collection.find(filter ? filter : {}, options ? options : {})
      .toArray()
      .catch(() => {
        throw new GlobalError('mustFindAny returns null', import.meta.url);
      }),
  );
};

export type PageOptions = {
  limit: number;
  page: number;
  skip: number;
};

export const preparePageOptions = (page?: { limit?: number | null; page?: number | null } | null): PageOptions => {
  const lim = page?.limit || 10;
  const sk = page?.page || 0;
  return {
    limit: lim,
    page: sk,
    skip: lim * sk,
  };
};


export function updateNestedFields(inputObject: Record<string, any>, nestedObjectName: string) {
  let updateObject: Record<string, any> = {};
  for (const field in inputObject) {
    if (
      typeof inputObject[field] === 'object' &&
      !Array.isArray(inputObject[field]) &&
      !(inputObject[field] instanceof Date)
    ) {
      const updateNestedObject: Record<string, any> = {};
      const updateNestedObjectSet = updateNestedFields(inputObject[field], field);
      for (const nestedField in updateNestedObjectSet) {
        const fieldName = `${field}.${nestedField}`;
        updateNestedObject[fieldName] = updateNestedObjectSet[field];
      }
      updateObject = { ...updateObject, ...updateNestedObject };
    } else {
    const fieldName = `${nestedObjectName}.${field}`;
    updateObject[fieldName] = inputObject[field];
    }
  }
  return updateObject;
}

export const isScalarDate = (obj: unknown): boolean => typeof obj === 'string' && obj !== null && !!Date.parse(obj);
export const inputServiceFiltersSet = (filters: any ) => {
  if (!filters) return {}
  const pa =
    filters &&
    Object.fromEntries(Object.entries(filters).filter((v) => v !== null && v !== undefined && v[0] !== 'fromDate' && v[0] !== 'toDate'));
  const fromDate = isScalarDate(filters.fromDate)
  const toDate = isScalarDate(filters.toDate)
       
  return {...pa, ...(toDate && { startDate: { $lte: new Date(filters.toDate as string) } }), ...(fromDate && { startDate: { $gte: new Date(filters.fromDate as string) } }), ...(filters?.name && { name: { $regex: filters.name, $options: 'i' } }),
  ...(filters?.description && {
    description: { $regex: filters.description, $options: 'i' },
  })}
  }


  export const inputBooksFiltersSet = (filters: any ) => {
    if (!filters) return {}
    const pa =
      filters &&
      Object.fromEntries(Object.entries(filters).filter((v) => v !== null && v !== undefined && v[0] !== 'fromDate' && v[0] !== 'toDate'));
    const fromDate = isScalarDate(filters.fromDate)
    const toDate = isScalarDate(filters.toDate)
    return {...pa, ...(toDate && { 'comments.to': { $lte: new Date(filters.toDate as string) } }), ...(fromDate && { 'comments.from': { $gte: new Date(filters.fromDate as string) } })}}
 