import webPush from 'web-push';
import { PushSubscription } from '../models/PushSubscription.js';
import { Types } from 'mongoose';

export function initWebPush(): void {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendPushToUser(
  userId: Types.ObjectId | string,
  payload: PushPayload,
): Promise<void> {
  const subscriptions = await PushSubscription.find({ userId });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const httpError = err as { statusCode?: number };
        if (httpError.statusCode === 410 || httpError.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }),
  );
}
