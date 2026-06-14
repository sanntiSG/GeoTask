import api from './api.service.js';
import { PushSubscriptionPayload } from '../types/index.js';

/**
 * Notification service — generic interface for web/native portability.
 * Swap implementation for @capacitor/push-notifications in native builds.
 */
export interface NotificationService {
  checkPermission(): Promise<'granted' | 'denied' | 'default'>;
  /** Returns the real browser NotificationPermission — 'granted' | 'denied' | 'default'. */
  requestPermission(): Promise<'granted' | 'denied' | 'default'>;
  subscribe(): Promise<{ ok: boolean; reason?: string }>;
  unsubscribe(): Promise<void>;
  isSubscribed(): Promise<boolean>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const webNotificationService: NotificationService = {
  async checkPermission() {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (!('Notification' in window)) return 'denied';
    // Return the raw browser value so callers can distinguish 'denied' (permanently
    // blocked — user must go to chrome://settings) from 'default' (dialog suppressed
    // by quiet-messaging — user clicks the bell icon in the address bar).
    return Notification.requestPermission();
  },

  async subscribe(): Promise<{ ok: boolean; reason?: string }> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { ok: false, reason: 'not-supported' };
    }
    if (Notification.permission !== 'granted') {
      return { ok: false, reason: 'permission-not-granted' };
    }

    try {
      // SW is registered by registerSW() in main.tsx (vite-plugin-pwa virtual module).
      // Wait for it to become active with a 10-second timeout.
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SW ready timeout')), 10_000),
        ),
      ]);

      const { data } = await api.get<{ publicKey: string }>('/notifications/vapid-public-key');
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      // Reuse existing subscription if present (avoids duplicate DB entries)
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const payload: PushSubscriptionPayload = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
        },
      };

      await api.post('/notifications/subscribe', payload);
      return { ok: true };
    } catch (err) {
      // Log in dev to surface VAPID / SW / network issues
      if (import.meta.env.DEV) console.warn('[Push subscribe error]', err);
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, reason: msg };
    }
  },

  async unsubscribe(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
      await api.delete('/notifications/unsubscribe');
    } catch {
      // unsubscribe errors are non-critical
    }
  },

  async isSubscribed(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  },
};

export const notificationService = webNotificationService;
