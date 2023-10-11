import PushNotifications from '@pusher/push-notifications-server';
import { getEnv } from '../envs.js';
import { GlobalError } from '../middleware.js';

export type NotificationPayload = {
  title: string;
  body: string;
};

const beamsClient = new PushNotifications({
  instanceId: getEnv('PUSHER_BEAM_INSTANCE_ID'),
  secretKey: getEnv('PUSHER_BEAM_SECRET_KEY'),
});

export const sendPushNotification = async (
  targets: string[],
  notification: NotificationPayload,
): Promise<{ result: boolean }> => {
  await beamsClient
    .publishToUsers(targets, {
      web: {
        notification,
      },
      fcm: {
        notification,
      },
      apns: {
        aps: {
          alert: notification,
        },
      },
    })
    .catch((err) => {
      throw new GlobalError('Failed to send push notification: ' + err, import.meta.url);
    });
  return { result: true };
};

export const generateBeamToken = (userId: string) => {
  beamsClient.generateToken(userId);
};
