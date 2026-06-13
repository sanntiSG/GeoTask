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

    try {
      const registration = await navigator.serviceWorker.ready;

      const { data } = await api.get<{ publicKey: string }>('/notifications/vapid-public-key');
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
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
    } catch {
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
