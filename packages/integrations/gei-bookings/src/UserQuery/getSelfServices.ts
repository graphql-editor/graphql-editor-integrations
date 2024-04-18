import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { convertDateObjToStringForArray, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { MongoOrb, inputServiceFiltersSet, preparePageOptions } from '../utils/db/orm.js';
import { ServicesCollection } from '../utils/db/collections.js';
import { isScalarDate } from '../PublicQuery/listServices.js';
import { ServiceModel } from '../models/ServiceModel.js';
import { WithId } from 'mongodb';

export const getSelfServices = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'getSelfServices', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      const po = preparePageOptions(args?.input?.page);
      
      const inputFilters = inputServiceFiltersSet(args?.input?.filters)
      
      const selfServices = await MongoOrb(ServicesCollection)
          .collection.find({
            ...inputFilters,
            ownerId: src.userId || src._id,
          })
          .limit(po.limit)
          .skip(po.skip)
          .sort('createdAt', -1)
          .toArray();
      return { service: convertDateObjToStringForArray<WithId<ServiceModel>>(selfServices) }
    }),
  )(input.arguments, input.source);
export default getSelfServices;



