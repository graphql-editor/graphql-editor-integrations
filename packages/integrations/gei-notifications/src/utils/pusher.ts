import Pusher from 'pusher';
import { getEnv } from './envs.js';
import { GlobalError } from './middleware.js';

export const channelsClient = new Pusher({
  appId: getEnv('PUSHER_CHANNEL_APP_ID'),
  key: getEnv('PUSHER_CHANNEL_KEY'),
  secret: getEnv('PUSHER_CHANNEL_SECRET'),
  cluster: getEnv('PUSHER_CHANNEL_CLUSTER'),
  useTLS: true,
});

export const sendStaticNotification = async (
  targets: string[],
  event: string,
  message: string,
): Promise<{ result: boolean }> => {
  await Promise.all(
    targets.map((target) =>
      channelsClient
        .trigger(target, event, {
          message,
        })
        .catch((err) => {
          throw new GlobalError('Failed to send static notification: ' + err, import.meta.url);
        }),
    ),
  );
  return { result: true };
};
