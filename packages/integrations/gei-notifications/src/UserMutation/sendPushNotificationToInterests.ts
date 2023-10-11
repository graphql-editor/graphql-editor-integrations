import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { errMiddleware } from '../utils/middleware.js';
import { sendPushNotificationToInterests } from '../utils/pusher/beam.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'sendPushNotificationToInterests', async (args) =>
    errMiddleware(async () => {
      if (args.input.targets.length > 5000)
        throw new Error('A device can be subscribed to a maximum of 5000 Device Interests.');

      return await sendPushNotificationToInterests(args.input.targets, args.input.notification);
    }),
  )(input.arguments);
