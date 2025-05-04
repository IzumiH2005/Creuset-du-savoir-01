
// Service Worker pour la fonctionnalité PWA
const CACHE_NAME = 'cds-flashcard-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Installation du service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Stratégie de cache : network first, puis cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cloner la réponse pour la mettre en cache
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            // Ne mettre en cache que les requêtes GET réussies
            if (event.request.method === 'GET' && response.status === 200) {
              cache.put(event.request, responseToCache);
            }
          });
        
        return response;
      })
      .catch(() => {
        // Utiliser le cache si la requête réseau échoue
        return caches.match(event.request);
      })
  );
});

// Nettoyage des anciens caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
