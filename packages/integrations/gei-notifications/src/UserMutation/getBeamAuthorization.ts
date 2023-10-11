import { FieldResolveInput } from 'stucco-js';
import { errMiddleware } from '../utils/middleware.js';
import { generateBeamToken } from '../utils/pusher/beam.js';
import { resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'getBeamAuthorization', async (args, { userId }) =>
    errMiddleware(async () => {
      return { auth: generateBeamToken(args?.userId || userId).token };
    }),
  )(input.arguments, input.source);
