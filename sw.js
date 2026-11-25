// Hors ligne : réseau d’abord, copie en cache sinon (indispensable le jour de la course).
const C = 'thp40-v177';
const SHELL = ['./', 'index.html', 'style.css?v=177', 'data.js?v=177', 'fit.js?v=177', 'app.js?v=177', 'auth.js?v=177', 'safe.js?v=177', 'csync.js?v=177', 'garmin.js?v=177', 'exo.js?v=177', 'exo-data.js?v=177', 'exo-mob.js?v=177', 'exo-txt.js?v=177', 'workout.js?v=177', 'sw-reg.js?v=177', 'supabase.min.js?v=177', 'icon.svg?v=177', 'icon-180.png?v=177', 'icon-192.png?v=177', 'icon-512.png?v=177', 'manifest.webmanifest?v=177', 'fonts/bricolage-grotesque-latin-400-normal.woff2', 'fonts/bricolage-grotesque-latin-500-normal.woff2', 'fonts/bricolage-grotesque-latin-600-normal.woff2', 'fonts/bricolage-grotesque-latin-700-normal.woff2', 'fonts/bricolage-grotesque-latin-800-normal.woff2', 'fonts/jetbrains-mono-latin-700-normal.woff2', 'fonts/hanken-grotesk-latin-400-normal.woff2', 'fonts/jetbrains-mono-latin-400-normal.woff2', 'fonts/jetbrains-mono-latin-500-normal.woff2', 'fonts/jetbrains-mono-latin-800-normal.woff2'];
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
