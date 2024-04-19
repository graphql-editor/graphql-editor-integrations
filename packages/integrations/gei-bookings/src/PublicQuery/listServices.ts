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
      const servicesCursor = MongoOrb(ServicesCollection)
      .collection.find({
      ...inputFilters,
      active: { $ne: false },
      taken: { $ne: true },
      })
  const paginatedServices = await (po.limit < 1 ? 
      servicesCursor
  : servicesCursor.limit(po.limit + 1).skip(po.skip)
  ).sort('createdAt', -1)
   .toArray()
    const hasNext = paginatedServices.length === po.limit + 1
if(hasNext) paginatedServices.pop();

return {
   services: convertDateObjToStringForArray(paginatedServices),
   hasNextPage: hasNext
};
  }),
  )(input.arguments);
export default listServices;
