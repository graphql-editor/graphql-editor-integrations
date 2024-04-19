import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { MongoOrb, inputBooksFiltersSet, preparePageOptions } from '../utils/db/orm.js';
import { convertDateObjToStringForArray, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';

export const getSelfBooks = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'getSelfBooks', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      const po = preparePageOptions(args?.input?.page);
      const inputFilters = inputBooksFiltersSet(args?.input?.filters)

      const bookingsCursor = MongoOrb('Bookings')
      .collection.find({ ...inputFilters, bookerId: src.userId || src._id })
      const paginatedBookings = await (po.limit < 1 ? 
        bookingsCursor
      : bookingsCursor.limit(po.limit + 1).skip(po.skip)
      ).sort('createdAt', -1)
       .toArray()
        const hasNext = paginatedBookings.length === po.limit + 1
    if(hasNext) paginatedBookings.pop();
    
    return { 
      books: convertDateObjToStringForArray(await MongoOrb('Bookings').composeRelated(paginatedBookings, 'services', 'Services', '_id')),
      hasNextPage: hasNext
     }
    }),
  )(input.arguments, input.source);
export default getSelfBooks;
