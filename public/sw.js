// LVMS Field Agent Service Worker
const CACHE_NAME = 'lvms-static-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/agent/login',
  '/agent',
  '/agent/cases',
  '/offline.html',
];

// Install Event - Pre-cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching partial static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First with Cache Fallback for navigation/static assets
// API requests (/api/...) are NEVER cached here to avoid stale banking data
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Exclude API requests and uploads from static cache
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // Network First strategy for dynamic pages and static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful static responses
        if (
          response.status === 200 &&
          (url.pathname.startsWith('/_next/static') ||
           url.pathname.startsWith('/icons') ||
           url.pathname === '/manifest.json')
        ) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Network unavailable', { status: 503, statusText: 'Offline' });
      })
  );
});
