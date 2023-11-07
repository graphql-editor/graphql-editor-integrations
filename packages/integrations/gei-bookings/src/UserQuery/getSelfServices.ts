import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { orm, preparePageOptions } from '../utils/db/orm.js';
import { ServicesCollection } from '../utils/db/collections.js';
import { isScalarDate } from '../PublicQuery/listServices.js';

export const getSelfServices = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'getSelfServices', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
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
        service: await o(ServicesCollection)
          .collection.find({
            ...pa,
            ...(fromDate && { createdAt: { $gte: new Date(args?.input?.filters?.fromDate as string) } }),
            ...(toDate && { createdAt: { $lte: new Date(args?.input?.filters?.toDate as string) } }),
            ...(args?.input?.filters?.name && { name: { $regex: args?.input.filters.name, $options: 'i' } }),
            ...(args?.input?.filters?.description && {
              description: { $regex: args?.input.filters.description, $options: 'i' },
            }),
            ownerId: src.userId,
          })
          .limit(po.limit)
          .skip(po.skip)
          .sort('createdAt', -1)
          .toArray(),
      }));
    }),
  )(input.arguments, input.source);
export default getSelfServices;
