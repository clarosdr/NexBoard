// Service Worker para NexBoard PWA
const CACHE_NAME = 'nexboard-v1.0.0';
const STATIC_CACHE = 'nexboard-static-v1';
const DYNAMIC_CACHE = 'nexboard-dynamic-v1';

// Archivos estáticos para cachear
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/favicon-32x32.svg',
  '/icons/apple-touch-icon.svg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.error('[SW] Error caching static files:', error);
      })
  );
  
  // Forzar la activación inmediata
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches antiguos
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  
  // Tomar control de todas las páginas inmediatamente
  self.clients.claim();
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar peticiones del mismo origen
  if (url.origin !== location.origin) {
    return;
  }
  
  // Estrategia Cache First para archivos estáticos
  if (STATIC_FILES.includes(url.pathname) || 
      url.pathname.includes('/icons/') ||
      url.pathname.includes('/assets/')) {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((networkResponse) => {
              // Cachear la respuesta para futuras peticiones
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return networkResponse;
            });
        })
        .catch(() => {
          // Fallback para archivos estáticos
          if (url.pathname === '/' || url.pathname.includes('.html')) {
            return caches.match('/index.html');
          }
        })
    );
    return;
  }
  
  // Estrategia Network First para datos dinámicos (localStorage)
  if (url.pathname.includes('/api/') || request.method === 'POST') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cachear respuestas exitosas
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback a cache si no hay red
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Respuesta offline personalizada
              return new Response(
                JSON.stringify({
                  error: 'Sin conexión',
                  message: 'Esta funcionalidad requiere conexión a internet',
                  offline: true
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }
              );
            });
        })
    );
    return;
  }
  
  // Para todas las demás peticiones, usar estrategia Network First
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        // Fallback a la página principal si no hay conexión
        return caches.match('/index.html');
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME
    });
  }
});

// Notificar actualizaciones disponibles
self.addEventListener('updatefound', () => {
  console.log('[SW] Update found');
});

// Manejar errores
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event.error);
});

// Sincronización en segundo plano (para futuras mejoras)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aquí se pueden sincronizar datos pendientes
      Promise.resolve()
    );
  }
});