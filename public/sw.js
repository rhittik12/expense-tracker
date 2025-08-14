const CACHE = 'exp-tracker-v2';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then(res => {
    if (res.ok && req.method === 'GET') cache.put(req, res.clone());
    return res;
  }).catch(()=> cached);
  return cached || fetchPromise;
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/api/')) {
      e.respondWith(staleWhileRevalidate(e.request));
      return;
    }
    if (e.request.mode === 'navigate') {
      e.respondWith(
        fetch(e.request).catch(()=>caches.match('/'))
      );
      return;
    }
  }
  e.respondWith(staleWhileRevalidate(e.request));
});
