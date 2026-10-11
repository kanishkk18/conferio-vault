const CACHE_VERSION = "v1";
const SHELL_CACHE = `securevault-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `securevault-runtime-${CACHE_VERSION}`;
const UPLOAD_DB_NAME = "securevault-upload-queue";
const UPLOAD_STORE = "pending";

const PRECACHE_URLS = [
  "/offline",
  "/login",
  "/register",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Only these GET endpoints are safe to cache — they're the person's own
// metadata (never decrypted content, since that only ever exists
// transiently in page memory). Never cache anything under /api/auth or
// any mutating method.
const CACHEABLE_API_PREFIXES = ["/api/passwords", "/api/media", "/api/share/mine", "/api/share/shared-with-me"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data === "FLUSH_UPLOAD_QUEUE") {
    flushUploadQueue();
  }
});

function isCacheableApi(pathname) {
  return CACHEABLE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never intercept mutating requests
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, falling back to a cached shell page, then /offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () => caches.match(request).then((cached) => cached || caches.match("/offline"))
      )
    );
    return;
  }

  // Vault metadata APIs: stale-while-revalidate, so the list of items is
  // visible offline even though nothing in it can be decrypted without a
  // network-derived or already-in-memory master key.
  if (isCacheableApi(url.pathname)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Static assets (Next.js build output, icons): cache-first.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Everything else: normal network passthrough, no interception.
});

// ---------------------------------------------------------------------
// Background sync: replay queued encrypted uploads once connectivity
// returns. The queue holds already-encrypted blobs (produced client-side
// before going offline) plus the metadata needed to request a *fresh*
// presigned URL at replay time, since presigned URLs expire in 15 minutes
// and a queued item may sit offline far longer than that.
// ---------------------------------------------------------------------

function openUploadQueueDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(UPLOAD_DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(UPLOAD_STORE)) {
        req.result.createObjectStore(UPLOAD_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllQueued() {
  const db = await openUploadQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UPLOAD_STORE, "readonly");
    const req = tx.objectStore(UPLOAD_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function removeQueued(id) {
  const db = await openUploadQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UPLOAD_STORE, "readwrite");
    tx.objectStore(UPLOAD_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function replayQueuedUpload(item) {
  const presignRes = await fetch("/api/media/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: item.fileName,
      mimeType: item.mimeType,
      fileSize: item.originalFileSize,
    }),
  });
  if (!presignRes.ok) throw new Error("Failed to get a fresh upload URL");
  const presigned = await presignRes.json();

  await fetch(presigned.uploadUrl, {
    method: "PUT",
    body: item.encryptedBlob,
    headers: { "Content-Type": "application/octet-stream" },
  });

  if (item.thumbnailBlob && presigned.thumbnailUploadUrl) {
    await fetch(presigned.thumbnailUploadUrl, {
      method: "PUT",
      body: item.thumbnailBlob,
      headers: { "Content-Type": "application/octet-stream" },
    });
  }

  const completeRes = await fetch("/api/media/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...item.uploadMeta,
      storageKey: presigned.storageKey,
      thumbnailKey: presigned.thumbnailKey,
      fileName: presigned.storageKey,
      originalName: item.fileName,
      mimeType: item.mimeType,
      fileSize: item.originalFileSize,
    }),
  });
  if (!completeRes.ok) throw new Error("Failed to register uploaded file");
}

async function flushUploadQueue() {
  const items = await getAllQueued();
  const results = [];
  for (const item of items) {
    try {
      await replayQueuedUpload(item);
      await removeQueued(item.id);
      results.push({ id: item.id, fileName: item.fileName, success: true });
    } catch (err) {
      results.push({ id: item.id, fileName: item.fileName, success: false, error: String(err) });
    }
  }
  if (results.length > 0) {
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({ type: "UPLOAD_QUEUE_FLUSHED", results });
    }
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "securevault-upload-queue") {
    event.waitUntil(flushUploadQueue());
  }
});

// Fallback for browsers without the Background Sync API (e.g. Safari):
// the page itself listens for the 'online' event and asks the service
// worker to flush directly via postMessage ("FLUSH_UPLOAD_QUEUE" above)
// — see hooks/use-upload-queue.ts.
