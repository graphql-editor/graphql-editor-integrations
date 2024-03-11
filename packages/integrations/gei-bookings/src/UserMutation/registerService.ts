import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { GlobalError, convertDateObjToStringForArray, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { mustFindAny, orm } from '../utils/db/orm.js';
import { ServicesCollection } from '../utils/db/collections.js';
import { ServiceModel } from '../models/ServiceModel.js';
import { ObjectId } from 'mongodb';

export const registerService = async (input: FieldResolveInput) =>
resolverFor('UserMutation', 'registerService', async (args, src) =>
  errMiddleware(async () => {
    sourceContainUserIdOrThrow(src);
    const services = args.input.startDates.map((startDate) => {
    if (new Date(String(startDate)) < new Date()) {
      throw new GlobalError('start date cannot start in past', import.meta.url);
    }
      return {
        _id: new ObjectId().toHexString(),
        createdAt: new Date(),
        startDate: new Date(String(startDate)),
        name: args.input.name,
        neededAccept: args.input.neededAccept === false ? false : true,
        description: args.input.description,
        ownerId: src.userId || src._id,
        active: true,
        time: args.input.time,
    }
  })
    const insert = await orm().then((o) =>
      o(ServicesCollection).collection.insertMany(services),
    );
    const insertedIdsArray = Object.values(insert.insertedIds);
    const createdServices =  await mustFindAny(ServicesCollection, { _id: {$in: insertedIdsArray} });
    return { service: convertDateObjToStringForArray(createdServices) };
  })
)(input.arguments, input.source);
export default registerService;