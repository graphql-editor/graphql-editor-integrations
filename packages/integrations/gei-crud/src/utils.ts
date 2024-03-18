import { ObjectId, Sort, SortDirection } from "mongodb";

export type PaginatedResult<T> = {
    [key: string]: T[] | string | undefined;
    cursorId: string | undefined;
  };

export function paginateObjects<T>(
    objects: T[],
    limit: number | undefined,
    propertyName: string,
    cursor?: number,
  ): PaginatedResult<T> {
    let cursorId = undefined;
    if (limit === objects.length) {
      objects.pop();
      cursorId =
        cursor?.toString() ||
        (objects[limit > 2 ? limit - 2 : 0] as { id?: string | undefined })?.id ||
        (objects[limit > 2 ? limit - 2 : 0] as { _id?: ObjectId | undefined })?._id?.toHexString();
    }
    const result: PaginatedResult<T> = {
      cursorId,
    };
  
    result[propertyName] = objects;
    return result;
  }


export const getPaginationOpts = (
    pageOptions?: { cursorId?: string | null; limit?: number | null } | null | undefined,
  ): { cursorId: string | undefined; limit: number } => ({
    cursorId: pageOptions?.cursorId || undefined,
    limit: (pageOptions?.limit || 10) + 1, // 10 orders default
  });

export const preparedSort = (sort?: { field?: string | null; order?: string | null } | null): Sort => {
    const direction = (sort?.order?.toLowerCase() || 'desc') as SortDirection;
    const sortById = ['_id', direction];
    return (
      sort?.field && sort.field !== 'CREATED_AT'
        ? [[snakeCaseToCamelCase(sort.field), direction], sortById]
        : sortById
    ) as Sort;
  };

  export const skipCursorForSortByField = (filter: any) =>
  filter?.sort?.field && filter.sort.field !== 'CREATED_AT'
    ? parseInt(filter.paginate?.cursorId || '0') + (filter.paginate?.limit || 0)
    : undefined;

export interface QueryObject {
        [key: string]: unknown;
      }
      
// Function to convert the object to the desired format
export function convertObjectToRegexFormat(obj: QueryObject): QueryObject | undefined {
        for (const key in obj) {
          if (Array.isArray(obj[key])) obj[key] = { $regex: { $in: obj[key] }, $options: 'i' };
          if (obj[key] && typeof obj[key] === 'string') obj[key] = { $regex: obj[key], $options: 'i' };
        }
        return obj;
      }
      
export function ifValueIsArray(obj: QueryObject): QueryObject | undefined {
        for (const key in obj) {
          if (Array.isArray(obj[key])) obj[key] = { $in: obj[key] };
        }
        return obj;
      }
      
export function snakeCaseToCamelCase(input: string | null | undefined) {
        return input?.toLowerCase().replace(/_([a-z])/g, (match, group1) => group1.toUpperCase());
      }
      
export function checkStringFields(obj: Record<string, unknown> | undefined): boolean {
        for (const key in obj) {
          if (typeof obj[key] === 'string' || Array.isArray(obj[key])) {
            return true;
          }
        }
        return false;
      }
      
export function convertDateFilter(obj: QueryObject): QueryObject | undefined {
        if (!obj) return {};
        return {
          [obj.dateFieldName ? (obj.dateFieldName as string) : 'createdAt']: {
            $gte: obj.from || '',
            ...(obj.to ? { $lte: obj.to } : {}),
          },
        };
      }
