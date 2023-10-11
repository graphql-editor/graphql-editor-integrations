import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { errMiddleware } from '../utils/middleware.js';
import { sendPushNotification } from '../utils/pusher/beam.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'sendPushNotification', async (args) =>
    errMiddleware(async () => await sendPushNotification(args.input.targets, args.input.notification)),
  )(input.arguments);
