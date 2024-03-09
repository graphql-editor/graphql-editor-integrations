import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { orm } from '../utils/db/orm.js';

export const updateService = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'updateService', async (args, src) =>
    errMiddleware(
      async () => {
        sourceContainUserIdOrThrow(src),
        Promise.all(args.input.map(async (update) => 
        await orm().then((o) =>
          o('Services')
            .collection.updateOne(
              { _id: args.serviceId, ownerId: src.userId || src._id, taken: { $ne: true }, active: { $ne: true } },
              {
                ...Object.fromEntries(Object.entries(update).filter((e) => e !== null)),
                startDate: new Date(String(update.startDate)),
              },
            )
            .then((u) => u && { service: o('Services').collection.findOne({ _id: args.serviceId }) }),
        )
      ))
      },
    ),
 
  )(input.arguments, input.source);
export default updateService;
