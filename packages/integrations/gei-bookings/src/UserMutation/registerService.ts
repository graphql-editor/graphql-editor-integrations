import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { GlobalError, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { mustFindOne, orm } from '../utils/db/orm.js';
import { ServicesCollection } from '../utils/db/collections.js';

export const registerService = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'registerService', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      if (new Date(String(args.input.startDate)) < new Date()) {
        throw new GlobalError('start date cannot start in past', import.meta.url);
      }
      const c = await orm().then((o) =>
        o(ServicesCollection).createWithAutoFields(
          '_id',
          'createdAt',
        )({
          startDate: new Date(String(args.input.startDate)),
          name: args.input.name,
          neededAccept: args.input.neededAccept || true,
          description: args.input.description,
          ownerId: src.userId,
          active: true,
          time: args.input.time,
        }),
      );

      return {
        service: await mustFindOne(ServicesCollection, { _id: c.insertedId }),
      };
    }),
  )(input.arguments, input.source);
export default registerService;
