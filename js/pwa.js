// PWA функционал
class PWAHelper {
  constructor() {
    this.init();
  }

  init() {
    this.registerServiceWorker();
  }

  // Регистрация Service Worker
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('ServiceWorker зарегистрирован: ', registration);
        })
        .catch((registrationError) => {
          console.log('ServiceWorker ошибка регистрации: ', registrationError);
        });
    }
  }
}

// Инициализируем PWA
new PWAHelper();