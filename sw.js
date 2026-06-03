// Convertify PWA Service Worker
// Enables PWA installation criteria without caching overhead

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch handler (required by Chrome to enable PWA installation)
  e.respondWith(fetch(e.request));
});
