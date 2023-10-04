import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { orm } from '../utils/db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor(
    'UserMutation',
    'createNotificationGroup',
    async (args) =>
      await orm()
        .then((o) =>
          o('NotificationGroup').createWithAutoFields(
            '_id',
            'createdAt',
          )({
            targets: args.input.users,
            name: args.input.name,
            notificationType: args.input.notificationType,
          }),
        )
        .then((r) => r.acknowledged),
  )(input.arguments);
