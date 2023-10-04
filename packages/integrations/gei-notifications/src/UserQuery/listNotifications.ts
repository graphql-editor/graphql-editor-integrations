import { FieldResolveInput } from 'stucco-js';
import { ModelTypes, resolverFor } from '../zeus/index.js';
import { orm, preparePageOptions, prepareDateOptions } from '../utils/db/orm.js';
import { errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';

export const checkIfStaticNotificationIsReaded = async (
  o: Awaited<ReturnType<typeof orm>>,
  notifications: ModelTypes['Notification'][],
  isReaded: boolean | null = false,
) => {
  const readedNotifications = await o('Notifications').composeRelated(
    notifications,
    '_id',
    'NotificationReaded',
    'notificationId',
  );
  return notifications.filter((notification) =>
    isReaded
      ? readedNotifications.some((rn) => rn._id === notification._id)
      : !readedNotifications.some((rn) => rn._id === notification._id),
  );
};

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'listNotifications', async (args, src) =>
    errMiddleware(async () => {
      sourceContainUserIdOrThrow(src);
      const { limit, page } = preparePageOptions(args.input?.page);
      const o = await orm();
      const notifications = await o('Notifications')
        .collection.find({
          ...(args.input?.filter?.notificationType && { notificationType: args.input.filter.notificationType }),
          ...prepareDateOptions(args.input?.filter?.startDate, args.input?.filter?.endDate),
        })
        .limit(limit)
        .skip(page)
        .sort({ createdAt: args.input?.filter?.sortDirection ? args.input.filter.sortDirection : 'desc' })
        .toArray();
      return { notification: await checkIfStaticNotificationIsReaded(o, notifications, args.input?.filter?.isReaded) };
    }),
  )(input.arguments, input.source);
