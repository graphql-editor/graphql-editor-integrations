import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { convertDateObjToStringForArray, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { mustFindAny, MongoOrb } from '../utils/db/orm.js';
import { ServicesCollection } from '../utils/db/collections.js';

export const updateService = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'updateService', async (args, src) =>
    errMiddleware(
      async () => (
        sourceContainUserIdOrThrow(src),
        Promise.all(args.input.map(async (updateSet) => {
          const entries = Object.entries(updateSet || {});
const reconstructedObject: Record<string, any> = {};

const entriesWithOutId = entries.filter(([key, value]) => key !== 'serviceId' && value !== undefined && value !== null);
if (!entriesWithOutId) {
  throw new Error(`You need update input argument for this resolver to work`);
}

entriesWithOutId.forEach((entry) => {
  const [key, value] = entry;
  reconstructedObject[key] = value;
});
       return MongoOrb('Services')
            .collection.updateOne(
              { _id: updateSet.serviceId, ownerId: src.userId || src._id, taken: { $ne: true } },
              { $set:
                {
                  ...reconstructedObject,
                  startDate: updateSet.startDate ? new Date(updateSet.startDate as string) : undefined,
                  updatedAt: new Date(),
                },
              },
            )
        }
      )).then(async (u) => u && { service: convertDateObjToStringForArray(await mustFindAny(ServicesCollection, { _id: { $in: args.input.map((up)=> up.serviceId) }})) })
      ),
    ),
 
  )(input.arguments, input.source);
export default updateService;
