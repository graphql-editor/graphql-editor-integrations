
import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { MongoOrb } from '../utils/db/orm.js';
import { GlobalError, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';

export const removeBooking = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'removeBooking', async (args, src) =>
      errMiddleware(async () => {
        sourceContainUserIdOrThrow(src);
        const booking = await MongoOrb('Bookings').collection.findOne({ _id: args._id });

        if (!booking || !booking.services)
          throw new GlobalError(`Booking not find for _id: ${args._id}`, import.meta.url);

        const removedServices = await MongoOrb('Services').collection.updateMany(
          { _id: { $in: booking.services }, taken: { $ne: false } },
          { $set: { taken: false } },
        );
        if (removedServices.modifiedCount < 1)
          throw new GlobalError(`Service with _id: '${booking.services}' for this booking not find`, import.meta.url);

        const removeBook = await MongoOrb('Bookings').collection.deleteOne({ _id: args._id });
        if (removeBook.deletedCount < 1) throw new GlobalError(`Booking has't been removed`, import.meta.url);
        return { removed: removeBook.deletedCount !== 0 };
      }))(input.arguments, input.source);
      export default removeBooking;