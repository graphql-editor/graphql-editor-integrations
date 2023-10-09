import { errMiddleware } from './../utils/middleware.js';
import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { channelsClient } from '../utils/pusher/channel.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'getChannelAuthorization', async (args) =>
    errMiddleware(async () => {
      const socketId = args.input.socketId;
      const channel = args.input.targetId;
      const auth = channelsClient.authorizeChannel(socketId, channel);
      return auth;
    }),
  )(input.arguments);
