import { FieldResolveInput } from 'stucco-js';
import { BookStatus, resolverFor } from '../zeus/index.js';
import { orm } from '../utils/db/orm.js';
import { GlobalError, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { ObjectId } from 'mongodb';

export const bookService = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'bookService', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      const o = await orm();

      const services = await Promise.all(args.input.serviceIds.map(async (serviceId) => {

       const service = await o('Services').collection.findOneAndUpdate(
        { _id: serviceId, taken: { $ne: true } },
        { $set: { taken: true } },
      );
      if (!service.value) {
        throw new GlobalError(`service is already taken: ${serviceId}`, import.meta.url);
      }
     
      return service.value 
    }))
    
      const book = await o('Bookings')
        .collection.insertOne(
          {
            _id: new ObjectId().toHexString(),
          createdAt: new Date(),
          bookerId: src.userId,
          serviceIds: args.input.serviceIds,
          comments: args.input.comments ? args.input.comments : undefined,
          status: services[0].neededAccept ? BookStatus.PENDING : BookStatus.ACCEPTED,
        })
        .then(async (c) => o('Bookings').collection.find({ _id: c.insertId } )?.toArray());
      if (!book) {
        throw new GlobalError('inserted document is null', import.meta.url);
      }
      return { book: { ...(await o('Bookings')).findOne({ _id: book.insertId }), services: services }};
    }),
  )(input.arguments, input.source);
export default bookService;
