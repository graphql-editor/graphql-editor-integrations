import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { errMiddleware } from '../utils/middleware.js';
import { sendPushNotificationToInterests } from '../utils/pusher/beam.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'sendPushNotificationToUsers', async (args) =>
    errMiddleware(async () => {
      if (args.input.targets.length > 100)
        throw new Error('A user can be associated with a maximum of 100 devices per platform at any given time');

      return await sendPushNotificationToInterests(args.input.targets, args.input.notification);
    }),
  )(input.arguments);
