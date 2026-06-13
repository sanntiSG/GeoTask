import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

// Background position sync (experimental PeriodicSync API)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'geo-sync') {
    event.waitUntil(syncPosition());
  }
});

async function syncPosition() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length > 0) return; // App is open, foreground handles it

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      });
    });

    await fetch(`${self.location.origin}/api/position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }),
    });
  } catch {
    // Background sync errors are non-critical
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: payload.tag,
      data: payload.data,
      vibrate: [100, 50, 100],
      requireInteraction: false,
    }),
  );
});

// Notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const taskId = event.notification.data?.taskId;
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
