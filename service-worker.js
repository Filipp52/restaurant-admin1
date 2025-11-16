// Базовый Service Worker для PWA
const CACHE_NAME = 'restaurant-admin-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/api-service.js',
  '/js/auth-service.js',
  '/js/menu-service.js',
  '/js/orders-service.js',
  '/js/analytics-service.js',
  '/js/app.js',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Установлен');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Кэширование файлов');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Активирован');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Удаление старого кэша', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Возвращаем кэшированную версию или делаем запрос
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});