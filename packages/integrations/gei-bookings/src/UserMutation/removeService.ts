import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { orm } from '../utils/db/orm.js';
import { sourceContainUserIdOrThrow } from '../utils/middleware.js';

export const removeService = async (input: FieldResolveInput) =>
  resolverFor(
    'UserMutation',
    'removeService',
    async (args, src) => (
      sourceContainUserIdOrThrow(src),
      orm()
        .then((o) =>
          o('Services').collection.updateOne(
            { _id: args.serviceId, ownerId: src.userId, active: { $ne: true }, taken: { $ne: true } },
            { $set: { active: false } },
          ),
        )
        .then((r) => ({ removed: r.modifiedCount !== 0 }))
    ),
  )(input.arguments, input.source);
export default removeService;
