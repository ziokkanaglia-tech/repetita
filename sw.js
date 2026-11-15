// Copia locale dell'app: si apre anche senza rete.
// A ogni aggiornamento cambia VERSIONE e tieni aggiornato l'elenco FILE (il test tests/ui.test.js lo controlla).
const VERSIONE = 'repetita-2.2.0';
const FILE = [
  './', 'index.html', 'manifest.webmanifest',
  'css/app.css',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'src/main.js',
  'src/core/backup.js', 'src/core/catalog.js', 'src/core/coach.js', 'src/core/disciplines.js', 'src/core/metrics.js', 'src/core/model.js', 'src/core/profile.js',
  'src/core/recommend.js', 'src/core/store.js', 'src/core/util.js', 'src/core/workout.js',
  'src/ui/ai.js', 'src/ui/app.js', 'src/ui/charts.js', 'src/ui/dom.js', 'src/ui/icons.js', 'src/ui/parts.js',
  'src/ui/sheet.js', 'src/ui/theme.js', 'src/ui/timer.js',
  'src/ui/views/coach.js', 'src/ui/views/disciplines.js', 'src/ui/views/exercises.js', 'src/ui/views/history.js', 'src/ui/views/profile.js', 'src/ui/views/progress.js',
  'src/ui/views/routines.js', 'src/ui/views/settings.js', 'src/ui/views/workout.js'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSIONE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
// Prima la rete (così gli aggiornamenti arrivano subito); senza rete, la copia salvata.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(VERSIONE).then(x => x.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
