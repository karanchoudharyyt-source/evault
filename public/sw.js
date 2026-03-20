// PackPulse Service Worker
// Receives push notifications even when the browser tab is closed

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push notification
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'PackPulse Alert', body: event.data.text() };
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.packId || 'packpulse-alert',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || 'https://evault-kappa.vercel.app',
      packId: data.packId,
    },
    actions: [
      { action: 'view',   title: '⚡ View Pack' },
      { action: 'pull',   title: '🟢 Pull on Courtyard' },
      { action: 'dismiss',title: '✕ Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PackPulse Alert', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url, packId } = event.notification.data || {};

  let target = url || 'https://evault-kappa.vercel.app';
  if (event.action === 'pull' && packId) {
    target = `https://courtyard.io/vending-machine/${packId}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('evault-kappa.vercel.app') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
