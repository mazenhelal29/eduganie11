// EduGenie Service Worker - v3
// Strategy: Cache-First for static assets, Network-First for API/navigation

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `edugenie-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `edugenie-dynamic-${CACHE_VERSION}`;

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/logo.jpg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// ─── INSTALL ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Cache what we can, silently ignore failures for missing assets
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            console.warn(`[SW] Could not cache: ${url}`);
          })
        )
      );
    })
  );
  // Take control immediately without waiting for old SW to die
  self.skipWaiting();
});

// ─── ACTIVATE ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ─── FETCH ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase API calls (always network-first, no caching)
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (JS, CSS, images, fonts) → Cache-First
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|svg|png|jpg|jpeg|ico|webp)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests (HTML pages) → Network-First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Everything else → Network-First
  event.respondWith(networkFirst(request));
});

// ─── STRATEGIES ─────────────────────────────────────────────────────────────

/** Cache-First: return cached version, update cache in background */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  // Not in cache → fetch and add to dynamic cache
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

/** Network-First: try network, fall back to cache */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** Network-First for navigation, fallback to offline page */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return cached home page or offline page
    return (
      (await caches.match('/')) ||
      (await caches.match('/offline.html')) ||
      new Response('<h1>غير متصل بالإنترنت</h1>', {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 503,
      })
    );
  }
}

// ─── SKIP WAITING MESSAGE ────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
