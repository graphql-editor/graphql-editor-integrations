import { FieldResolveInput } from 'stucco-js';
import { BookStatus, resolverFor } from '../zeus/index.js';
import { GlobalError, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { orm } from '../utils/db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'respondOnServiceRequest', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      if (args.input?.answer === BookStatus.PENDING) {
        throw new GlobalError('answer cannot be pending', import.meta.url);
      }
      const o = await orm();
      await o('Bookings')
        .collection.findOne({ _id: args.input.bookId, answeredAt: { $exists: false } })
        .then(async (b) => {
          if (!b) {
            throw new GlobalError(`cannot find book with id: ${args.input.bookId}`, import.meta.url);
          }
          await o('Services')
            .collection.findOne({ _id: b.service, ownerId: src.userId })
            .then((r) => {
              if (!r) {
                throw new GlobalError('you can answer only on yours services', import.meta.url);
              }
            });
        });
      return orm().then((o) =>
        o('Bookings')
          .collection.updateOne(
            { _id: args.input.bookId },
            { $set: { answeredAt: new Date(), status: args.input.answer } },
          )
          .then((r) => ({ status: r.modifiedCount !== 0 })),
      );
    }),
  )(input.arguments, input.source);
