const CACHE = 'noun-cards-v3';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Cache first: the app opens instantly from the phone, even on a weak or missing signal.
// When there is a connection, a fresh copy is fetched in the background for next launch.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate';
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(isPage ? 'index.html' : e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(r => {
      if (r && r.ok) cache.put(isPage ? 'index.html' : e.request, r.clone());
      return r;
    }).catch(() => null);
    if (cached) { e.waitUntil(fresh); return cached; }
    return (await fresh) || new Response('Offline', { status: 503 });
  })());
});
