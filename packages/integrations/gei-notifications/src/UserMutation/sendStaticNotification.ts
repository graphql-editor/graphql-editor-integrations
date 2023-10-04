import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { errMiddleware } from '../utils/middleware.js';
import { sendStaticNotification } from '../utils/pusher/channel.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'sendStaticNotification', async (args) =>
    errMiddleware(
      async () => await sendStaticNotification(args.input.channelsId, args.input.event, args.input.message),
    ),
  )(input.arguments);
