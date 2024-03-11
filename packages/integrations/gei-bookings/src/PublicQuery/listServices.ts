import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { convertDateObjToStringForArray, errMiddleware } from '../utils/middleware.js';
import { orm, preparePageOptions } from '../utils/db/orm.js';
import { ServicesCollection } from '../utils/db/collections.js';

export const isScalarDate = (obj: unknown): boolean => typeof obj === 'string' && obj !== null && !!Date.parse(obj);
export const listServices = async (input: FieldResolveInput) =>
  resolverFor('PublicQuery', 'listServices', async (args) =>
    errMiddleware(async () => {
      const po = preparePageOptions(args?.input?.page);
      const pa =
        args?.input?.filters &&
        Object.fromEntries(Object.entries(args?.input?.filters).filter((v) => v !== null && v !== undefined));
      const fromDate = isScalarDate(args?.input?.filters?.fromDate)
        ? isScalarDate(args?.input?.filters?.fromDate)
        : undefined;

      const toDate = isScalarDate(args?.input?.filters?.toDate)
        ? isScalarDate(args?.input?.filters?.toDate)
        : undefined;
        return await orm().then(async (o) => ({
        services: convertDateObjToStringForArray(await o(ServicesCollection)
          .collection.find({
            ...pa,
            ...(fromDate && { createdAt: { $gte: new Date(args?.input?.filters?.fromDate as string) } }),
            ...(toDate && { createdAt: { $lte: new Date(args?.input?.filters?.toDate as string) } }),
            ...(args?.input?.filters?.name && { name: { $regex: args?.input.filters.name, $options: 'i' } }),
            ...(args?.input?.filters?.description && {
              description: { $regex: args?.input.filters.description, $options: 'i' },
            }),
            active: { $ne: false },
            taken: { $ne: true },
          })
          .limit(po.limit)
          .skip(po.skip)
          .sort('createdAt', -1)
          .toArray(),
    )}));
    }),
  )(input.arguments);
export default listServices;
