import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { generateBeamToken } from '../utils/beam.js';
import { errMiddleware } from '../utils/middleware.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('UserQuery', 'getPushNotificationToken', async (args, { userId }) =>
    errMiddleware(async () => {
      return generateBeamToken(userId);
    }),
  )(input.arguments, input.source);
