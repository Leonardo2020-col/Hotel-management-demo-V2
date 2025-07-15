// public/sw.js - Service Worker para Hotel Paraíso
const CACHE_NAME = 'hotel-paraiso-v1.0.0';
const DATA_CACHE_NAME = 'hotel-data-v1.0.0';

// Archivos estáticos a cachear
const FILES_TO_CACHE = [
  '/',
  '/dashboard',
  '/checkin',
  '/rooms',
  '/guests',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Agregar más recursos críticos
  '/offline.html'
];

// URLs de API que se pueden cachear para uso offline
const API_URLS_TO_CACHE = [
  '/api/rooms/status',
  '/api/guests/current',
  '/api/reservations/today',
  '/api/dashboard/stats'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache de archivos estáticos
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Pre-caching offline page');
        return cache.addAll(FILES_TO_CACHE);
      }),
      // Cache de datos de API
      caches.open(DATA_CACHE_NAME).then((cache) => {
        console.log('[SW] Pre-caching API data');
        return Promise.allSettled(
          API_URLS_TO_CACHE.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                cache.put(url, response.clone());
              }
            }).catch(() => {
              // Ignorar errores en desarrollo
              console.log(`[SW] Could not cache ${url}`);
            })
          )
        );
      })
    ])
  );
  
  // Activar inmediatamente
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[SW] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Manejar requests de API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Manejar requests de navegación (páginas)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Manejar recursos estáticos
  event.respondWith(handleStaticRequest(request));
});

// Manejar requests de API con strategy Network First
async function handleAPIRequest(request) {
  try {
    // Intentar red primero
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Si es exitoso, actualizar cache
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Si falla la red, buscar en cache
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Agregar header para indicar que viene de cache
      const response = cachedResponse.clone();
      response.headers.set('X-Cache-Status', 'offline');
      return response;
    }
    
    // Si no hay cache, retornar datos mock básicos
    return getMockResponse(request);
  }
}

// Manejar requests de navegación
async function handleNavigationRequest(request) {
  try {
    // Intentar red primero
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Si falla, buscar en cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback a página offline
    return caches.match('/offline.html') || 
           caches.match('/') || 
           new Response('Offline - No cached content available');
  }
}

// Manejar recursos estáticos con strategy Cache First
async function handleStaticRequest(request) {
  // Buscar en cache primero
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Si no está en cache, buscar en red
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear para futuras requests
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Si todo falla, retornar respuesta básica
    return new Response('Resource not available offline', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Generar respuestas mock para APIs críticas cuando están offline
function getMockResponse(request) {
  const url = new URL(request.url);
  
  // Mock data básico para diferentes endpoints
  const mockData = {
    '/api/rooms/status': {
      success: true,
      data: {
        total: 45,
        available: 13,
        occupied: 32,
        cleaning: 0,
        maintenance: 0
      },
      offline: true
    },
    '/api/dashboard/stats': {
      success: true,
      data: {
        occupancy: 71,
        revenue: 15750,
        guests: 32,
        checkIns: 8
      },
      offline: true
    }
  };

  const responseData = mockData[url.pathname];
  
  if (responseData) {
    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache-Status': 'offline-mock'
      }
    });
  }
  
  // Respuesta genérica para APIs no manejadas
  return new Response(JSON.stringify({
    success: false,
    error: 'Service temporarily unavailable (offline)',
    offline: true
  }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'X-Cache-Status': 'offline-error'
    }
  });
}

// Manejar notificaciones push (para futuro)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación del hotel',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Hotel Paraíso', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Logging mejorado
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded successfully');