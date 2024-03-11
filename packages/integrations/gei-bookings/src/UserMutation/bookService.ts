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
      console.log(service);
      
      return service.value 
    }))
    console.log(services);
    
      const books = await o('Bookings')
        .collection.insertMany(services.map((service) =>(
          {
            _id: new ObjectId().toHexString(),
          createdAt: new Date(),
          bookerId: src.userId,
          service: service._id ,
          comments: args.input.comments ? args.input.comments : undefined,
          status: service.neededAccept ? BookStatus.PENDING : BookStatus.ACCEPTED,
        })))
        .then(async (c) => o('Bookings').collection.find({ _id: { $in: Object.values(c.insertedIds)} })?.toArray());
      if (!books) {
        throw new GlobalError('inserted document is null', import.meta.url);
      }
      console.log(books);
      return { books: await o('Bookings').composeRelated(books, 'service', 'Services', '_id') };
    }),
  )(input.arguments, input.source);
export default bookService;
