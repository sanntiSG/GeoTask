import webPush from 'web-push';
import { PushSubscription } from '../models/PushSubscription';
import { Types } from 'mongoose';

export function initWebPush(): void {
  try {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
    console.log('[Push] VAPID keys loaded OK');
  } catch (err) {
    console.error('[Push] VAPID init FAILED — check VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT in .env:', err);
  }
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export interface SendSummary {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ endpoint: string; statusCode?: number; message: string }>;
}

export async function sendPushToUser(
  userId: Types.ObjectId | string,
  payload: PushPayload,
): Promise<SendSummary> {
  const subscriptions = await PushSubscription.find({ userId });
  const summary: SendSummary = { total: subscriptions.length, sent: 0, failed: 0, errors: [] };

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
        );
        summary.sent++;
      } catch (err: unknown) {
        summary.failed++;
        const httpError = err as { statusCode?: number; body?: string; message?: string };
        const entry = {
          endpoint: sub.endpoint.slice(-40), // last 40 chars to avoid huge logs
          statusCode: httpError.statusCode,
          message: httpError.body ?? httpError.message ?? String(err),
        };
        summary.errors.push(entry);

        // Subscription expired or invalid — clean up so we don't keep retrying
        if (httpError.statusCode === 410 || httpError.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          // 401 / 403 usually means a VAPID keypair mismatch or wrong subject
          console.warn('[Push] sendNotification error:', entry);
        }
      }
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Push] sendPushToUser summary for user ${userId}:`, summary);
  }

  return summary;
}
