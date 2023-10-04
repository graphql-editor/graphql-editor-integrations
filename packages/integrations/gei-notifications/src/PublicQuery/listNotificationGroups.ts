import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { orm, prepareDateOptions, preparePageOptions } from '../utils/db/orm.js';

export const isNotNullObject = (v: unknown): v is Record<string | number | symbol, unknown> =>
  typeof v === 'object' && v !== null;

export const handler = async (input: FieldResolveInput) =>
  resolverFor('PublicQuery', 'listNotificationGroups', async (args, src) => {
    const { limit, skip } = preparePageOptions(args.input?.page);
    const o = await orm();
    console.log('abc');
    return await o('NotificationGroup')
      .collection.find({
        ...(args.input?.filter?.name && { name: { $regex: args.input.filter.name } }),
        ...(args.input?.filter?.targetId && { targets: args.input.filter.targetId }),
        ...prepareDateOptions(args.input?.filter?.startDate, args.input?.filter?.endDate),
        ...(args.input?.filter?.notificationType && { notificationType: args.input.filter.notificationType }),
      })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: args.input?.filter?.sortDirection ? args.input.filter.sortDirection : 'desc' })
      .toArray();
  })(input.arguments, input.source);
