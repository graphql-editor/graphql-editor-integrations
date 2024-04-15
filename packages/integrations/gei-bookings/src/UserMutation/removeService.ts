import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { MongoOrb } from '../utils/db/orm.js';
import { sourceContainUserIdOrThrow } from '../utils/middleware.js';

export const removeService = async (input: FieldResolveInput) =>
  resolverFor(
    'UserMutation',
    'removeService',
    async (args, src) => (
      sourceContainUserIdOrThrow(src),
      MongoOrb('Services').collection.updateOne(
            { _id: args.serviceId, ownerId: src.userId || src._id, active: { $ne: true }, taken: { $ne: true } },
            { $set: { active: false } },
          )
        .then((r) => ({ removed: r.modifiedCount !== 0 }))
    ),
  )(input.arguments, input.source);
export default removeService;
