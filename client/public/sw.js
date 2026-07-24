const CACHE_NAME = 'netprep-cache-v2';
const STATIC_CACHE = 'netprep-static-v2';
const DYNAMIC_CACHE = 'netprep-dynamic-v2';
const API_CACHE = 'netprep-api-v2';

// Static assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// Install event - cache static assets safely
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(async (cache) => {
        console.log('[SW] Pre-caching static assets');
        for (const asset of STATIC_ASSETS) {
          try {
            await cache.add(asset);
          } catch (e) {
            console.warn('[SW] Could not pre-cache asset:', asset, e);
          }
        }
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2...');
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => !currentCaches.includes(cacheName))
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip all dev server / localhost requests to prevent aggressive caching during development
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // API requests - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets (images, fonts, etc.) - Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages & Navigation - Network First with offline fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Everything else - Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Check if request is for a static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webp'
  ];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Cache First strategy - good for static assets
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Update in background silently
      fetchAndCache(request, cacheName).catch(() => {});
      return cachedResponse;
    }
    return await fetchAndCache(request, cacheName);
  } catch (error) {
    console.warn('[SW] Cache First failed for:', request.url);
    return new Response('Asset unavailable', { status: 404 });
  }
}

// Network First strategy - good for API calls
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone()).catch(() => {});
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response for API
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'You are offline. Please check your internet connection.' 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Network First with offline fallback for HTML pages & SPA Navigation
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone()).catch(() => {});
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for HTML/Navigation, checking cache:', request.url);
  }

  // 1. Try exact URL match in cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  // 2. Try index.html in cache (for SPA routing)
  const indexResponse = await caches.match('/index.html');
  if (indexResponse) return indexResponse;

  // 3. Try / in cache
  const rootResponse = await caches.match('/');
  if (rootResponse) return rootResponse;

  // 4. Guaranteed valid Response object fallback (never return undefined)
  return new Response(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>NETprep - Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>You are offline</h2><p>Please check your internet connection and reload.</p></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// Stale While Revalidate - return cached, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetchAndCache(request, cacheName)
    .then((netRes) => netRes)
    .catch((error) => {
      console.warn('[SW] Background fetch failed for:', request.url);
      if (cachedResponse) return cachedResponse;
      return new Response('', { status: 504, statusText: 'Gateway Timeout' });
    });

  if (cachedResponse) {
    return cachedResponse;
  }
  
  return fetchPromise;
}

// Fetch and cache helper
async function fetchAndCache(request, cacheName) {
  const networkResponse = await fetch(request);
  
  if (networkResponse && networkResponse.ok) {
    try {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    } catch (e) {
      // Ignore cache put errors (e.g. quota, opaque)
    }
  }
  
  return networkResponse;
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-test-attempt') {
    event.waitUntil(syncTestAttempts());
  }
  
  if (event.tag === 'sync-questions') {
    event.waitUntil(syncQuestions());
  }
});

// Sync test attempts when back online
async function syncTestAttempts() {
  console.log('[SW] Syncing test attempts...');
  // Implementation will be added when we handle offline test submissions
}

// Sync imported questions when back online
async function syncQuestions() {
  console.log('[SW] Syncing questions...');
  // Implementation will be added when we handle offline question imports
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'NETprep',
    body: 'New notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler for communication with the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(
          names.map((name) => caches.delete(name))
        );
      }).then(() => {
        console.log('[SW] All caches cleared');
      })
    );
  }
  
  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.source.postMessage({
          type: 'CACHE_SIZE',
          size: size
        });
      })
    );
  }
});

// Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

console.log('[SW] Service Worker script loaded');