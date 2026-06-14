/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function getKeys(sub: PushSubscription): { p256dh: string; auth: string } {
  return {
    p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
    auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
  };
}

async function postSubscriptionToServer(sub: PushSubscription): Promise<void> {
  await fetch(`${self.location.origin}/api/notifications/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ endpoint: sub.endpoint, keys: getKeys(sub) }),
  });
}

// ---------------------------------------------------------------------------
// Background position sync (periodicsync)
// ---------------------------------------------------------------------------

interface PeriodicSyncEvent extends Event {
  readonly tag: string;
  waitUntil(promise: Promise<unknown>): void;
}
self.addEventListener('periodicsync', (event) => {
  const syncEvent = event as PeriodicSyncEvent;
  if (syncEvent.tag === 'geo-sync') {
    syncEvent.waitUntil(syncPosition());
  }
});

async function syncPosition(): Promise<void> {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length > 0) return; // App is open, foreground handles it

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      });
    });

    const { latitude: lat, longitude: lng } = position.coords;

    await fetch(`${self.location.origin}/api/position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ lat, lng }),
    });
  } catch {
    // Background sync errors are non-critical
  }
}

// ---------------------------------------------------------------------------
// Push notification handler
// ---------------------------------------------------------------------------

self.addEventListener('push', (event) => {
  console.log('[SW] push event received', event.data ? 'with data' : 'empty data');

  if (!event.data) {
    console.warn('[SW] push event had no data — nothing to show');
    return;
  }

  let payload: { title: string; body: string; icon?: string; tag?: string; data?: Record<string, unknown> };
  try {
    payload = event.data.json() as typeof payload;
  } catch (err) {
    console.warn('[SW] push data is not valid JSON:', err);
    return;
  }

  console.log('[SW] showing notification:', payload.title);

  // vibrate / renotify are not in the TS NotificationOptions type but are supported by browsers.
  // renotify: true — without this, a second notification with the same `tag` silently replaces
  // the first one in the notification tray without any sound or pop, which is why only the first
  // push was ever visible ("llega una y después ninguna").
  const notifOpts = {
    body: payload.body,
    icon: payload.icon ?? '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: payload.tag,
    renotify: true,
    data: payload.data,
    vibrate: [100, 50, 100],
    requireInteraction: false,
  } as NotificationOptions;

  event.waitUntil(
    self.registration
      .showNotification(payload.title, notifOpts)
      .catch((err) => console.error('[SW] showNotification failed:', err)),
  );
});

// ---------------------------------------------------------------------------
// Push subscription change — auto re-subscribe when browser rotates / expires the key
// ---------------------------------------------------------------------------

interface PushSubscriptionChangeEvent extends ExtendableEvent {
  readonly newSubscription: PushSubscription | null;
  readonly oldSubscription: PushSubscription | null;
}

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] pushsubscriptionchange fired — re-subscribing');
  const changeEvent = event as PushSubscriptionChangeEvent;
  changeEvent.waitUntil(handleSubscriptionChange(changeEvent.newSubscription));
});

async function handleSubscriptionChange(newSub: PushSubscription | null): Promise<void> {
  try {
    // VITE_VAPID_PUBLIC_KEY is injected by Vite into this bundled SW file
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
    if (!vapidPublicKey) {
      console.error('[SW] VITE_VAPID_PUBLIC_KEY is not set — cannot re-subscribe');
      return;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Use the already-renewed subscription if provided, otherwise create a new one
    const subscription =
      newSub ??
      (await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      }));

    await postSubscriptionToServer(subscription);
    console.log('[SW] pushsubscriptionchange: re-subscribed and posted to server OK');
  } catch (err) {
    console.warn('[SW] pushsubscriptionchange: re-subscribe failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Notification click — open or focus the app
// ---------------------------------------------------------------------------

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const taskId = (event.notification.data as { taskId?: string } | null)?.taskId;
  const url = taskId ? `/?task=${taskId}` : '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', taskId });
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
