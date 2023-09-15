import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { sourceContainUserIdOrThrow, errMiddleware } from '../utils/middleware.js';
import { orm, preparePageOptions } from '../utils/db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'getBookingsForService', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      const po = preparePageOptions(args?.input?.page);

      const ownedServices = await orm().then((o) =>
        o('Services')
          .collection.find({ ownerId: src.userId })
          .toArray()
          .then((s) => s.map((ss) => ss._id)),
      );
      return await orm().then(async (o) => ({
        books: await o('Bookings')
          .collection.find({ service: { $in: ownedServices } })
          .limit(po.limit)
          .skip(po.skip)
          .sort('createdAt', -1)
          .toArray(),
      }));
    }),
  )(input.arguments, input.source);
