import { FieldResolveInput } from 'stucco-js';
import { BookStatus, resolverFor } from '../zeus/index.js';
import { MongoOrb } from '../utils/db/orm.js';
import { GlobalError, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { ObjectId, WithId } from 'mongodb';
import { ServiceModel } from '../models/ServiceModel.js';

export const bookService = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'bookService', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      const bookServices = await Promise.all(
      args.input.serviceIds.map(
        async (serviceId: string) =>
          (
           await MongoOrb('Services').collection.findOneAndUpdate(
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
    
      if (busy[0]) {
        await MongoOrb('Services').collection.updateMany(
          { _id: { $in: bookedServices.map((s: any) => s._id) } },
          { $set: { taken: false } },
        );
        throw new GlobalError(`Service is already taken: ${busy}`, import.meta.url);
      }
  


      const book = await MongoOrb('Bookings')
        .collection.insertOne(
          {
            _id: new ObjectId().toHexString(),
          createdAt: new Date(),
          bookerId: src.userId || src._id || args.input.comments?.user?.email,
          services: args.input.serviceIds,
          comments: args.input.comments
          ? {
              ...args.input.comments,
              user: args.input.comments.user
                ? {
                    ...args.input.comments.user,
                    secondName: args.input.comments.user.secondName || undefined,
                    phone: args.input.comments.user.phone || undefined,
                    name: args.input.comments.user.name,
                    email: args.input.comments.user.email || undefined
                  }
                : undefined,
              comments: args.input.comments.comments || undefined,
              numberOfGuests: args.input.comments.numberOfGuests || undefined,
              numberOfKids: args.input.comments.numberOfKids || undefined,
              animals: args.input.comments.animals || undefined,
              lateCheckIn: args.input.comments.lateCheckIn || undefined,
              price: args.input.comments.price || undefined
            }
          : undefined,
          status: bookedServices[0].neededAccept ? BookStatus.PENDING : BookStatus.ACCEPTED,
        })
        .then(async (c) => MongoOrb('Bookings').collection.findOne({ _id: c.insertedId } ));
      if (!book) {
        throw new GlobalError('inserted document is null', import.meta.url);
      }
      return { book: { ...book, services: bookedServices }};
    }),
  )(input.arguments, input.source);
export default bookService;
