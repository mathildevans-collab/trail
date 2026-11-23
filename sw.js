// Hors ligne : réseau d’abord, copie en cache sinon (indispensable le jour de la course).
const C = 'thp40-v113';
const SHELL = ['./', 'index.html', 'style.css?v=113', 'data.js?v=113', 'fit.js?v=113', 'app.js?v=113', 'auth.js?v=113', 'safe.js?v=113', 'csync.js?v=113', 'garmin.js?v=113', 'exo.js?v=113', 'exo-data.js?v=113', 'exo-mob.js?v=113', 'exo-txt.js?v=113', 'workout.js?v=113', 'sw-reg.js?v=113', 'supabase.min.js?v=113', 'icon.svg?v=113', 'icon-192.png?v=113', 'manifest.webmanifest?v=113', 'fonts/bricolage-grotesque-latin-600-normal.woff2', 'fonts/bricolage-grotesque-latin-700-normal.woff2', 'fonts/bricolage-grotesque-latin-800-normal.woff2', 'fonts/jetbrains-mono-latin-700-normal.woff2', 'fonts/hanken-grotesk-latin-400-normal.woff2', 'fonts/jetbrains-mono-latin-400-normal.woff2', 'fonts/jetbrains-mono-latin-500-normal.woff2', 'fonts/jetbrains-mono-latin-700-normal.woff2', 'fonts/jetbrains-mono-latin-800-normal.woff2', 'fonts/hanken-grotesk-latin-500-normal.woff2', 'fonts/hanken-grotesk-latin-600-normal.woff2', 'fonts/hanken-grotesk-latin-700-normal.woff2'];
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
