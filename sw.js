const CACHE_NAME = 'baac-customer-pwa-v25';
const APP_SHELL = [
  './',
  './index.html',
  './install.html',
  './member.html',
  './products.html',
  './consignor.html',
  './app.js',
  './manifest.webmanifest',
  './customer-font.css',
  './icon.svg',
  './icon-192.png',
  './tier-general-art.png',
  './tier-silver-art.png',
  './tier-gold-art.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first: ป้องกัน iPhone/Safari ค้างไฟล์ JS/CSS เวอร์ชันเก่า
  event.respondWith(
    fetch(
      request.mode === 'navigate'
        ? new Request(request, { cache: 'no-store' })
        : request
    )
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        return (await caches.match(request)) ||
          (request.mode === 'navigate'
            ? await caches.match('./index.html')
            : Response.error());
      })
  );
});
