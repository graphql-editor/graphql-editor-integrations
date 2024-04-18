import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { sourceContainUserIdOrThrow, errMiddleware, convertDateObjToStringForArray } from '../utils/middleware.js';
import { MongoOrb, inputBooksFiltersSet, preparePageOptions } from '../utils/db/orm.js';
import { BookingRecordModel } from '../models/BookingRecordModel.js';

export const getBookingsForService = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'getBookingsForService', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      const po = preparePageOptions(args?.input?.page);
      const inputFilters = inputBooksFiltersSet(args?.input?.filters)
       

      const ownedServices = await MongoOrb('Services')
          .collection.find({ ownerId: src.userId || src._id })
          .toArray()
          .then((s) => s.map((ss) => ss._id))

      const bookings =  await MongoOrb('Bookings')
          .collection.find({ ...inputFilters, services: { $in: ownedServices } })
          .limit(po.limit)
          .skip(po.skip)
          .sort('createdAt', -1)
          .toArray()

    return { books: convertDateObjToStringForArray<BookingRecordModel>(await MongoOrb('Bookings').composeRelated(bookings, 'services', 'Services', '_id')) }
    }),
  )(input.arguments, input.source);
export default getBookingsForService;
