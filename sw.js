const CACHE_NAME = 'keepnext-v1';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/api.js',
    './js/auth.js',
    './js/config.js',
    './js/external-apis.js',
    './js/stats.js',
    './js/store.js',
    './js/supabase-client.js',
    './js/ui.js',
    './assets/icon.svg',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
