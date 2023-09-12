import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { orm, preparePageOptions } from '../utils/db/orm.js';
import { errMiddleware } from '../utils/middleware.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'getSelfBooks', async (args, src) =>
    errMiddleware(async () => {
      const po = preparePageOptions(args.input?.page);
      return await orm().then((o) =>
        o('Bookings')
          .collection.find({ bookerId: src.userId })
          .skip(po.skip)
          .limit(po.limit)
          .sort('createdAt', -1)
          .toArray()
          .then(async (b) => await orm().then((o) => o('Bookings').composeRelated(b, 'service', 'Services', '_id')))
          .then((r) => ({ books: r })),
      );
    }),
  )(input.arguments, input.source);
