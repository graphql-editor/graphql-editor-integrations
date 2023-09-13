import { FieldResolveInput } from 'stucco-js';
import { BookStatus, resolverFor } from '../zeus/index.js';
import { orm } from '../utils/db/orm.js';
import { GlobalError, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'bookService', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      const o = await orm();
      const service = await o('Services').collection.findOneAndUpdate(
        { _id: args.input.serviceId, taken: { $ne: true } },
        { $set: { taken: true } },
      );
      if (!service.value) {
        throw new GlobalError(`service is already taken: ${args.input.serviceId}`, import.meta.url);
      }
      const book = await o('Bookings')
        .createWithAutoFields(
          '_id',
          'createdAt',
        )({
          bookerId: src.userId,
          service: args.input.serviceId,
          comments: args.input.comments ? args.input.comments : undefined,
          status: service.value.neededAccept ? BookStatus.PENDING : BookStatus.ACCEPTED,
        })
        .then(async (c) => await o('Bookings').collection.findOne({ _id: c.insertedId }));
      if (!book) {
        throw new GlobalError('inserted document is null', import.meta.url);
      }
      return { book: { ...book, service: service.value } };
    }),
  )(input.arguments, input.source);
