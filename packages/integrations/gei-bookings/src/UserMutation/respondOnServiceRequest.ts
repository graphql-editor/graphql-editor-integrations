import { FieldResolveInput } from 'stucco-js';
import { BookStatus, resolverFor } from '../zeus/index.js';
import { GlobalError, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { orm } from '../utils/db/orm.js';

export const respondOnServiceRequest = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'respondOnServiceRequest', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      if (args.input?.answer === BookStatus.PENDING) {
        throw new GlobalError('answer cannot be pending', import.meta.url);
      }
      const o = await orm();
      await o('Bookings')
        .collection.find({ _id: { $in: args.input.bookIds }, answeredAt: { $exists: false } }).toArray()
        .then(async (b) => {
          if (!b || b.length < 1) {
            throw new GlobalError(`cannot find anyone books for id: ${ args.input.bookIds }`, import.meta.url);
          }
          await o('Services')
            .collection.findOne({ _id: {$in: b.map((b) => b.service)}, ownerId: src.userId || src._id})
            .then((r) => {
              if (!r || b.length < 1) {
                throw new GlobalError('you can answer only on yours services', import.meta.url);
              }
            });
        });
      return await orm().then((o) =>
        o('Bookings')
          .collection.updateMany(
            { _id: { $in: args.input.bookIds} },
            { $set: { answeredAt: new Date(), status: args.input.answer } },
          )
          .then((r) => ({ status: r.modifiedCount !== 0 })),
      );
    }),
  )(input.arguments, input.source);
export default respondOnServiceRequest;
