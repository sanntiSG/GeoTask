import api from './api.service.js';
import { PushSubscriptionPayload } from '../types/index.js';

/**
 * Notification service — generic interface for web/native portability.
 * Swap implementation for @capacitor/push-notifications in native builds.
 */
export interface NotificationService {
  checkPermission(): Promise<'granted' | 'denied' | 'default'>;
  requestPermission(): Promise<'granted' | 'denied'>;
  subscribe(): Promise<boolean>;
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

  async requestPermission(): Promise<'granted' | 'denied'> {
    if (!('Notification' in window)) return 'denied';
    const result = await Notification.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  },

  async subscribe(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      // Ensure a SW registration exists (may not be registered in dev mode)
      let reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }

      // Wait for the SW to become active with a 10-second timeout
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
      return true;
    } catch (err) {
      // Log only in dev — never expose user data in production logs
      if (import.meta.env.DEV) console.warn('[Push subscribe error]', err);
      return false;
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
