import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { MongoOrb, inputBooksFiltersSet, preparePageOptions } from '../utils/db/orm.js';
import { convertDateObjToStringForArray, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';

export const getSelfBooks = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'getSelfBooks', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      const po = preparePageOptions(args?.input?.page);
      const inputFilters = inputBooksFiltersSet(args.input?.filters)

      return {
        books: convertDateObjToStringForArray(await MongoOrb('Bookings')
          .collection.find({ ...inputFilters, bookerId: src.userId || src._id })
          .skip(po.skip)
          .limit(po.limit)
          .sort('createdAt', -1)
          .toArray()
          .then(async (b) => MongoOrb('Bookings').composeRelated(b, 'services', 'Services', '_id'))),
      };
    }),
  )(input.arguments, input.source);
export default getSelfBooks;
