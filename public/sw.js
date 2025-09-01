/* Minimal PWA SW: toma control inmediato y evita quedarse con la versión vieja */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// (Opcional) Aquí podrías agregar lógica de caché fino si la necesitas:
// self.addEventListener('fetch', (event) => {
//   // Estrategias runtime si aplican
// });