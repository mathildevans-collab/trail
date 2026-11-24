// Hors ligne : réseau d’abord, copie en cache sinon (indispensable le jour de la course).
const C = 'thp40-v153';
const SHELL = ['./', 'index.html', 'style.css?v=153', 'data.js?v=153', 'fit.js?v=153', 'app.js?v=153', 'auth.js?v=153', 'safe.js?v=153', 'csync.js?v=153', 'garmin.js?v=153', 'exo.js?v=153', 'exo-data.js?v=153', 'exo-mob.js?v=153', 'exo-txt.js?v=153', 'workout.js?v=153', 'sw-reg.js?v=153', 'supabase.min.js?v=153', 'icon.svg?v=153', 'icon-192.png?v=153', 'manifest.webmanifest?v=153', 'fonts/bricolage-grotesque-latin-600-normal.woff2', 'fonts/bricolage-grotesque-latin-700-normal.woff2', 'fonts/bricolage-grotesque-latin-800-normal.woff2', 'fonts/jetbrains-mono-latin-700-normal.woff2', 'fonts/hanken-grotesk-latin-400-normal.woff2', 'fonts/jetbrains-mono-latin-400-normal.woff2', 'fonts/jetbrains-mono-latin-500-normal.woff2', 'fonts/jetbrains-mono-latin-700-normal.woff2', 'fonts/jetbrains-mono-latin-800-normal.woff2', 'fonts/hanken-grotesk-latin-500-normal.woff2', 'fonts/hanken-grotesk-latin-600-normal.woff2', 'fonts/hanken-grotesk-latin-700-normal.woff2'];
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
