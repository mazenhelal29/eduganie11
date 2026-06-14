const CACHE_NAME = "edugenie-v3";
const OFFLINE_QUEUE_KEY = "edugenie-offline-queue";

const APP_SHELL_URLS = [
  "/",
  "/dashboard",
  "/attendance/scanner",
  "/students",
  "/manifest.webmanifest",
  "/logo.jpg",
];

function shouldSkipCache(requestUrl) {
  return (
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith("/auth/") ||
    requestUrl.pathname.startsWith("/api/") ||
    requestUrl.pathname.includes("supabase.co")
  );
}

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL_URLS).catch(() => {
        // Don't fail install if some URLs are unavailable
      })
    )
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (shouldSkipCache(url)) return;

  // Network-first for navigation (HTML pages)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, clone)
          );
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) =>
          cache.put(event.request, clone)
        );
        return response;
      });
    })
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-attendance") {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  // Open IndexedDB to get queued offline scans
  try {
    const db = await openDB();
    const tx = db.transaction("offline-scans", "readwrite");
    const store = tx.objectStore("offline-scans");
    const allKeys = await getAllKeys(store);
    
    for (const key of allKeys) {
      const record = await getRecord(store, key);
      if (!record) continue;
      
      try {
        // Attempt to sync with Supabase
        const response = await fetch("/api/sync-attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });
        if (response.ok) {
          await deleteRecord(store, key);
        }
      } catch {
        // Keep in queue if sync fails
      }
    }
  } catch (err) {
    console.log("Sync failed, will retry:", err);
  }
}

// ── IndexedDB Helpers ─────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("edugenie-offline", 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("offline-scans", {
        keyPath: "id",
        autoIncrement: true,
      });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllKeys(store) {
  return new Promise((resolve) => {
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });
}

function getRecord(store, key) {
  return new Promise((resolve) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function deleteRecord(store, key) {
  return new Promise((resolve) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "EduGenie";
  const body = data.body || "لديك إشعار جديد";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo.jpg",
      badge: "/logo.jpg",
      dir: "rtl",
      lang: "ar",
    })
  );
});
