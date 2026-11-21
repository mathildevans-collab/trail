// Hors ligne : réseau d’abord, copie en cache sinon (indispensable le jour de la course).
const C = 'thp40-v70';
const SHELL = ['./', 'index.html', 'style.css?v=70', 'data.js?v=70', 'fit.js?v=70', 'app.js?v=70', 'safe.js?v=70', 'csync.js?v=70', 'garmin.js?v=70', 'exo.js?v=70', 'exo-data.js?v=70', 'exo-mob.js?v=70', 'exo-txt.js?v=70', 'workout.js?v=70', 'icon.svg?v=70', 'icon-192.png?v=70', 'manifest.webmanifest?v=70', 'fonts/bricolage-grotesque-latin-600-normal.woff2', 'fonts/bricolage-grotesque-latin-700-normal.woff2', 'fonts/bricolage-grotesque-latin-800-normal.woff2', 'fonts/jetbrains-mono-latin-700-normal.woff2', 'fonts/hanken-grotesk-latin-400-normal.woff2', 'fonts/jetbrains-mono-latin-400-normal.woff2', 'fonts/jetbrains-mono-latin-500-normal.woff2', 'fonts/jetbrains-mono-latin-700-normal.woff2', 'fonts/jetbrains-mono-latin-800-normal.woff2', 'fonts/hanken-grotesk-latin-500-normal.woff2', 'fonts/hanken-grotesk-latin-600-normal.woff2', 'fonts/hanken-grotesk-latin-700-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const same = u.origin === location.origin;
  if (!same) return;               // Strava (activities.json) : jamais mis en cache ici
  e.respondWith(fetch(r, same ? { cache: 'no-store' } : undefined).then(res => { if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(C).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r).then(m => m || caches.match(r, { ignoreSearch: true }))));
});
