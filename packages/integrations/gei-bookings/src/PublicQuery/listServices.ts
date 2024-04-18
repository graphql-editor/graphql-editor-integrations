import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { convertDateObjToStringForArray, errMiddleware } from '../utils/middleware.js';
import { MongoOrb, inputServiceFiltersSet, preparePageOptions } from '../utils/db/orm.js';
import { ServicesCollection } from '../utils/db/collections.js';

export const isScalarDate = (obj: unknown): boolean => typeof obj === 'string' && obj !== null && !!Date.parse(obj);
export const listServices = async (input: FieldResolveInput) =>
  resolverFor('PublicQuery', 'listServices', async (args) =>
    errMiddleware(async () => {
      const po = preparePageOptions(args?.input?.page);
      const inputFilters = inputServiceFiltersSet(args?.input?.filters)
        return {
        services: convertDateObjToStringForArray(await MongoOrb(ServicesCollection)
          .collection.find({
            ...inputFilters,
            active: { $ne: false },
            taken: { $ne: true },
          })
          .limit(po.limit)
          .skip(po.skip)
          .sort('createdAt', -1)
          .toArray(),
    )};
    }),
  )(input.arguments);
export default listServices;
