import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { convertDateObjToStringForArray, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { mustFindAny, orm } from '../utils/db/orm.js';
import { ServicesCollection } from '../utils/db/collections.js';

export const updateService = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'updateService', async (args, src) =>
    errMiddleware(
      async () => (
        sourceContainUserIdOrThrow(src),
        Promise.all(args.input.map(async (updateSet) => 
        await orm().then((o) =>
          o('Services')
            .collection.updateOne(
              { _id: updateSet.serviceId, ownerId: src.userId || src._id, taken: { $ne: true }, active: { $ne: true } },
              {$set:
                {
                ...Object.fromEntries(Object.entries({...updateSet, startDate: updateSet.startDate?  new Date(updateSet.startDate as string) : undefined }).filter((e) => e !== null)),       
                updatedAt: new Date,
              }},
            )

        )
      )).then(async (u) => u && { service: convertDateObjToStringForArray(await mustFindAny(ServicesCollection, { _id: { $in: args.input.map((up)=>up.serviceId) } })) })
      ),
    ),
 
  )(input.arguments, input.source);
export default updateService;
