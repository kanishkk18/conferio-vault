"use client";

const DB_NAME = "securevault-upload-queue";
const STORE_NAME = "pending";

export interface QueuedUpload {
  id: string;
  encryptedBlob: Blob;
  thumbnailBlob: Blob | null;
  fileName: string;
  mimeType: string;
  originalFileSize: number;
  uploadMeta: Record<string, unknown>;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueUpload(item: QueuedUpload): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedUploads(): Promise<QueuedUpload[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueLength(): Promise<number> {
  return (await getQueuedUploads()).length;
}

/**
 * Registers a Background Sync request if the browser supports it
 * (Chrome/Edge/most Android browsers). On browsers without it (Safari,
 * Firefox as of this writing), the upload just stays queued until
 * useUploadQueueFlush's 'online' listener asks the service worker to
 * flush it directly.
 */
export async function requestBackgroundSync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  if ("sync" in registration) {
    try {
      // @ts-expect-error -- SyncManager isn't in the default lib.dom types yet
      await registration.sync.register("securevault-upload-queue");
    } catch {
      // Background Sync not available/permitted — the 'online' fallback covers it.
    }
  }
}
