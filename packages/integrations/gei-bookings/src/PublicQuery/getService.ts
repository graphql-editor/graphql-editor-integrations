import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { GlobalError, convertDatedObjToString, errMiddleware } from '../utils/middleware.js';
import { MongoOrb } from '../utils/db/orm.js';

export const getService = async (input: FieldResolveInput) =>
  resolverFor('PublicQuery', 'getService', async (args) =>
    errMiddleware(async () => {
      return ({
          service: convertDatedObjToString(await MongoOrb('Services').collection.findOne({ _id: args.serviceId, active: { $ne: false } }).catch((r) => {
            throw new GlobalError(r, import.meta.url);
          }))
        })
        
    }),
  )(input.arguments);
export default getService;
