// Базовый Service Worker для PWA
const CACHE_NAME = 'restaurant-admin-v1';

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Установлен');
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Активирован');
});

// Перехват запросов
self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
});