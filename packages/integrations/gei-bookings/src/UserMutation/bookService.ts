import { FieldResolveInput } from 'stucco-js';
import { BookStatus, resolverFor } from '../zeus/index.js';
import { orm } from '../utils/db/orm.js';
import { GlobalError, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { ObjectId, WithId } from 'mongodb';
import { ServiceModel } from '../models/ServiceModel.js';

export const bookService = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'bookService', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      const o = await orm();

    
    const bookServices = await Promise.all(
      args.input.serviceIds.map(
        async (serviceId: string) =>
          (
            await o('Services').collection.findOneAndUpdate(
              { _id: serviceId, taken: { $ne: true } },
              { $set: { taken: true } },
            )
          ).value || serviceId,
      ),
    );
    const [bookedServices, busy] = [
      bookServices.filter((s): s is WithId<ServiceModel>  => typeof s !== 'string'),
      bookServices.filter((s): s is string => typeof s === 'string')
  ];
    bookServices.forEach(async (s) => {
      if (typeof s === 'string') {
        await o('Services').collection.updateMany(
          { _id: { $in: bookedServices.map((s: any) => s._id) } },
          { $set: { taken: false } },
        );
        throw new GlobalError(`Service is already taken: ${s}`, import.meta.url);
      }
      return s._id;
    });


      const book = await o('Bookings')
        .collection.insertOne(
          {
            _id: new ObjectId().toHexString(),
          createdAt: new Date(),
          bookerId: src.userId,
          services: args.input.serviceIds,
          comments: args.input.comments ? args.input.comments : undefined,
          status: bookedServices[0].neededAccept ? BookStatus.PENDING : BookStatus.ACCEPTED,
        })
        .then(async (c) => o('Bookings').collection.findOne({ _id: c.insertedId } ));
      if (!book) {
        throw new GlobalError('inserted document is null', import.meta.url);
      }
      return { book: { ...book, services: bookedServices }};
    }),
  )(input.arguments, input.source);
export default bookService;
