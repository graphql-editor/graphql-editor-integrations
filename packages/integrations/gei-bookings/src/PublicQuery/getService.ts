import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { GlobalError, errMiddleware } from '../utils/middleware.js';
import { orm } from '../utils/db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('PublicQuery', 'getService', async (args) =>
    errMiddleware(async () => {
      return await orm()
        .then(async (o) => ({
          service: await o('Services').collection.findOne({ _id: args.serviceId, active: { $ne: false } }),
        }))
        .catch((r) => {
          throw new GlobalError(r, import.meta.url);
        });
    }),
  )(input.arguments);
