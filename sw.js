/* Service Worker WordFlow: офлайн-работа и быстрый запуск.
   При обновлении файлов приложения увеличьте номер версии ниже. */
const VERSION = 'wordflow-v5';
const APP_SHELL = [
  './', './index.html', './styles.css', './app.js', './practice.js', './cloud.js', './config.js',
  './data/base.js', './data/sentences.js', './data/texts.js', './data/ua.js', './manifest.json',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'
];
const CDN_HOSTS = ['cdn.tailwindcss.com', 'unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Таблицы — всегда из сети (свежие данные)
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  // Supabase (вход и синхронизация) — всегда из сети
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) return;

  // Библиотеки с CDN — сначала кэш
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Файлы приложения — сеть, при её отсутствии кэш
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
    );
  }
});
