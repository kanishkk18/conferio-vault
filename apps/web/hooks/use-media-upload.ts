// "use client";

// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { VaultEncryption } from "@securevault/encryption";
// import { inferFileType, type CompleteUploadInput } from "@securevault/shared-types";
// import { generateThumbnail, wrapFileKey } from "@/lib/media-encryption";
// import { enqueueUpload, requestBackgroundSync } from "@/lib/upload-queue";

// export interface MediaUploadParams {
//   file: File;
//   masterKey: CryptoKey;
//   caption?: string;
//   tags?: string[];
//   /** If provided, this file is protected by its own password instead of the master key. */
//   filePassword?: string;
//   onProgress?: (percent: number) => void;
// }

// export type MediaUploadResult = { status: "uploaded"; item: unknown } | { status: "queued" };

// interface PresignedUploadResponse {
//   uploadUrl: string;
//   storageKey: string;
//   thumbnailKey?: string;
//   thumbnailUploadUrl?: string;
// }

// async function putEncryptedBlob(url: string, blob: Blob): Promise<void> {
//   const res = await fetch(url, {
//     method: "PUT",
//     body: blob,
//     headers: { "Content-Type": "application/octet-stream" },
//   });
//   if (!res.ok) throw new Error("Upload to storage failed");
// }

// /** True for fetch's characteristic "network unreachable" failure — not for a real HTTP error response. */
// function isNetworkError(err: unknown): boolean {
//   return err instanceof TypeError || !navigator.onLine;
// }

// export function useMediaUpload() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({
//       file,
//       masterKey,
//       caption,
//       tags,
//       filePassword,
//       onProgress,
//     }: MediaUploadParams): Promise<MediaUploadResult> => {
//       // Encryption happens unconditionally, offline or not — it's pure
//       // client-side computation with no network dependency.
//       const fileKey = await VaultEncryption.generateItemKey();
//       const { blob: encryptedBlob, baseIv, chunkSize, chunkCount } = await VaultEncryption.encryptFile(
//         file,
//         fileKey,
//         onProgress
//       );

//       let thumbnailBlob: Blob | null = null;
//       let thumbnailIv: string | undefined;
//       const plainThumb = await generateThumbnail(file);
//       if (plainThumb) {
//         const thumbBuffer = await plainThumb.arrayBuffer();
//         const { ciphertext, iv } = await VaultEncryption.encryptBuffer(thumbBuffer, fileKey);
//         thumbnailIv = iv;
//         thumbnailBlob = new Blob([ciphertext]);
//       }

//       const wrapped = filePassword
//         ? await wrapFileKey(fileKey, { filePassword })
//         : await wrapFileKey(fileKey, { masterKey });
//       const adminRawFileKey = await VaultEncryption.exportKeyRaw(fileKey);

//       const uploadMeta = {
//         fileType: inferFileType(file.type),
//         iv: baseIv,
//         chunkSize,
//         chunkCount,
//         thumbnailIv,
//         adminRawFileKey,
//         caption,
//         tags: tags ?? [],
//         isHidden: false,
//         ...wrapped,
//       };

//       const attemptUpload = async (): Promise<MediaUploadResult> => {
//         const presignedRes = await fetch("/api/media/presigned", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }),
//         });
//         if (!presignedRes.ok) {
//           throw new Error(
//             (await presignedRes.json().catch(() => null))?.error ?? "Failed to start upload"
//           );
//         }
//         const presigned: PresignedUploadResponse = await presignedRes.json();

//         await putEncryptedBlob(presigned.uploadUrl, encryptedBlob);
//         if (thumbnailBlob && presigned.thumbnailUploadUrl) {
//           await putEncryptedBlob(presigned.thumbnailUploadUrl, thumbnailBlob);
//         }

//         const completePayload: CompleteUploadInput = {
//           ...uploadMeta,
//           storageKey: presigned.storageKey,
//           thumbnailKey: presigned.thumbnailKey,
//           fileName: presigned.storageKey,
//           originalName: file.name,
//           mimeType: file.type,
//           fileSize: file.size,
//         } as CompleteUploadInput;

//         const completeRes = await fetch("/api/media/complete", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(completePayload),
//         });
//         if (!completeRes.ok) {
//           throw new Error((await completeRes.json().catch(() => null))?.error ?? "Failed to save file");
//         }
//         return { status: "uploaded", item: await completeRes.json() };
//       };

//       try {
//         if (!navigator.onLine) throw new TypeError("offline");
//         return await attemptUpload();
//       } catch (err) {
//         if (!isNetworkError(err)) throw err; // a real server error (e.g. validation) — don't queue, surface it

//         await enqueueUpload({
//           id: crypto.randomUUID(),
//           encryptedBlob,
//           thumbnailBlob,
//           fileName: file.name,
//           mimeType: file.type,
//           originalFileSize: file.size,
//           uploadMeta,
//           createdAt: Date.now(),
//         });
//         await requestBackgroundSync();
//         return { status: "queued" };
//       }
//     },
//     onSuccess: (result) => {
//       if (result.status === "uploaded") {
//         queryClient.invalidateQueries({ queryKey: ["media"] });
//       }
//     },
//   });
// }

// hooks/use-media-upload.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { VaultEncryption } from "@securevault/encryption";
import { inferFileType, type CompleteUploadInput } from "@securevault/shared-types";
import { generateThumbnail, wrapFileKey } from "@/lib/media-encryption";
import { enqueueUpload, requestBackgroundSync } from "@/lib/upload-queue";

/* ─── Config ────────────────────────────────────────────────────────── */

export const MAX_UPLOAD_SIZE_BYTES =
  (Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB) || 2048) * 1024 * 1024;

/** Switch to multipart upload above this encrypted‑payload size. */
const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50 MB
/** Each S3 part – must be ≥ 5 MB. 8 MB is a good balance. */
const PART_SIZE = 8 * 1024 * 1024;
const MAX_PART_RETRIES = 3;
const RETRY_BASE_MS = 1_000;

/* ─── Helpers ───────────────────────────────────────────────────────── */

async function retry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= MAX_PART_RETRIES)
        throw new Error(`${label} failed after ${MAX_PART_RETRIES + 1} attempts`);
      await new Promise((r) =>
        setTimeout(r, RETRY_BASE_MS * 2 ** attempt + Math.random() * 500),
      );
    }
  }
}

function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError || !navigator.onLine;
}

async function putEncryptedBlob(url: string, blob: Blob): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": "application/octet-stream" },
  });
  if (!res.ok) throw new Error("Upload to storage failed");
}

/* ─── Multipart upload ──────────────────────────────────────────────── */

interface MultipartInitResponse {
  uploadId: string;
  storageKey: string;
  thumbnailKey?: string;
}

/**
 * Uploads an encrypted blob via S3 multipart upload.
 * Requires three server endpoints (see inline comments).
 */
async function multipartUpload(
  encryptedBlob: Blob,
  meta: { fileName: string; mimeType: string; fileSize: number },
  onUploadProgress?: (percent: number) => void,
): Promise<Pick<MultipartInitResponse, "storageKey" | "thumbnailKey">> {
  const totalParts = Math.max(1, Math.ceil(encryptedBlob.size / PART_SIZE));

  /* 1 ─ Initiate */
  const { uploadId, storageKey, thumbnailKey } = await retry(async () => {
    const res = await fetch("/api/media/multipart/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: meta.fileName,
        mimeType: meta.mimeType,
        fileSize: meta.fileSize,
        parts: totalParts,
      }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Multipart init failed");
    return res.json() as Promise<MultipartInitResponse>;
  }, "Multipart init");

  /* 2 ─ Upload each part */
  const completedParts: Array<{ PartNumber: number; ETag: string }> = [];
  let bytesUploaded = 0;

  for (let i = 0; i < totalParts; i++) {
    const partNumber = i + 1;
    const start = i * PART_SIZE;
    const end = Math.min(start + PART_SIZE, encryptedBlob.size);
    const partBlob = encryptedBlob.slice(start, end);

    /* 2a ─ Get presigned URL for this part */
    const { partUrl } = await retry(async () => {
      const res = await fetch("/api/media/multipart/part-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, storageKey, partNumber }),
      });
      if (!res.ok) throw new Error("Part URL request failed");
      return res.json() as Promise<{ partUrl: string }>;
    }, `Part ${partNumber} URL`);

    /* 2b ─ PUT the part */
    const etag = await retry(async () => {
      const res = await fetch(partUrl, {
        method: "PUT",
        body: partBlob,
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (!res.ok) throw new Error(`Part ${partNumber} upload failed`);
      const e = res.headers.get("ETag");
      if (!e) throw new Error("No ETag returned");
      return e;
    }, `Part ${partNumber} upload`);

    completedParts.push({ PartNumber: partNumber, ETag: etag });
    bytesUploaded += end - start;
    onUploadProgress?.(Math.round((bytesUploaded / encryptedBlob.size) * 100));
  }

  /* 3 ─ Finalise on S3 */
  await retry(async () => {
    const res = await fetch("/api/media/multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, storageKey, parts: completedParts }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Multipart complete failed");
  }, "Multipart complete");

  return { storageKey, thumbnailKey };
}

/* ─── beforeunload guard ────────────────────────────────────────────── */

let activeUploads = 0;

function guardOn() {
  activeUploads++;
  if (activeUploads === 1) window.addEventListener("beforeunload", warnUnload);
}
function guardOff() {
  activeUploads = Math.max(0, activeUploads - 1);
  if (activeUploads === 0) window.removeEventListener("beforeunload", warnUnload);
}
function warnUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
  e.returnValue = "";
}

/* ─── Types ─────────────────────────────────────────────────────────── */

export interface MediaUploadParams {
  file: File;
  masterKey: CryptoKey;
  caption?: string;
  tags?: string[];
  /** If provided, this file is protected by its own password instead of the master key. */
  filePassword?: string;
  onProgress?: (percent: number) => void;
}

export type MediaUploadResult = { status: "uploaded"; item: unknown } | { status: "queued" };

interface PresignedUploadResponse {
  uploadUrl: string;
  storageKey: string;
  thumbnailKey?: string;
  thumbnailUploadUrl?: string;
}

/* ─── Hook ──────────────────────────────────────────────────────────── */

export function useMediaUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      masterKey,
      caption,
      tags,
      filePassword,
      onProgress,
    }: MediaUploadParams): Promise<MediaUploadResult> => {
      /* ── Size gate ── */
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        const limitMb = Math.round(MAX_UPLOAD_SIZE_BYTES / 1024 / 1024);
        const fileMb = (file.size / 1024 / 1024).toFixed(1);
        throw new Error(`File is ${fileMb} MB — exceeds the ${limitMb} MB upload limit.`);
      }

      guardOn();

      try {
        /* ── Encrypt (always runs — pure client-side, no network) ── */
        const fileKey = await VaultEncryption.generateItemKey();
        const { blob: encryptedBlob, baseIv, chunkSize, chunkCount } =
          await VaultEncryption.encryptFile(file, fileKey, onProgress);

        let thumbnailBlob: Blob | null = null;
        let thumbnailIv: string | undefined;
        const plainThumb = await generateThumbnail(file);
        if (plainThumb) {
          const thumbBuffer = await plainThumb.arrayBuffer();
          const { ciphertext, iv } = await VaultEncryption.encryptBuffer(thumbBuffer, fileKey);
          thumbnailIv = iv;
          thumbnailBlob = new Blob([ciphertext]);
        }

        const wrapped = filePassword
          ? await wrapFileKey(fileKey, { filePassword })
          : await wrapFileKey(fileKey, { masterKey });
        const adminRawFileKey = await VaultEncryption.exportKeyRaw(fileKey);

        const uploadMeta = {
          fileType: inferFileType(file.type),
          iv: baseIv,
          chunkSize,
          chunkCount,
          thumbnailIv,
          adminRawFileKey,
          caption,
          tags: tags ?? [],
          isHidden: false,
          ...wrapped,
        };

        /* ── Upload attempt ── */
        const attemptUpload = async (): Promise<MediaUploadResult> => {
          const useMultipart = encryptedBlob.size >= MULTIPART_THRESHOLD;

          let storageKey: string;
          let thumbnailKey: string | undefined;

          if (useMultipart) {
            /* ── Multipart path (large files) ── */
            const mpResult = await multipartUpload(
              encryptedBlob,
              { fileName: file.name, mimeType: file.type, fileSize: file.size },
              onProgress, // re-use callback for upload progress after encryption
            );
            storageKey = mpResult.storageKey;
            thumbnailKey = mpResult.thumbnailKey;

            /* Upload thumbnail via simple PUT (always small) */
            if (thumbnailBlob && thumbnailKey) {
              const thumbRes = await fetch("/api/media/presigned", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fileName: `thumb-${file.name}`,
                  mimeType: "image/jpeg",
                  fileSize: thumbnailBlob.size,
                }),
              });
              if (thumbRes.ok) {
                const thumbData: PresignedUploadResponse = await thumbRes.json();
                await putEncryptedBlob(thumbData.uploadUrl, thumbnailBlob);
              }
            }
          } else {
            /* ── Single-PUT path (small files) ── */
            const presignedRes = await fetch("/api/media/presigned", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: file.name,
                mimeType: file.type,
                fileSize: file.size,
              }),
            });
            if (!presignedRes.ok) {
              throw new Error(
                (await presignedRes.json().catch(() => null))?.error ?? "Failed to start upload",
              );
            }
            const presigned: PresignedUploadResponse = await presignedRes.json();

            await putEncryptedBlob(presigned.uploadUrl, encryptedBlob);
            if (thumbnailBlob && presigned.thumbnailUploadUrl) {
              await putEncryptedBlob(presigned.thumbnailUploadUrl, thumbnailBlob);
            }

            storageKey = presigned.storageKey;
            thumbnailKey = presigned.thumbnailKey;
          }

          /* ── Complete ── */
          const completePayload: CompleteUploadInput = {
            ...uploadMeta,
            storageKey,
            thumbnailKey,
            fileName: storageKey,
            originalName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          } as CompleteUploadInput;

          const completeRes = await fetch("/api/media/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(completePayload),
          });
          if (!completeRes.ok) {
            throw new Error(
              (await completeRes.json().catch(() => null))?.error ?? "Failed to save file",
            );
          }
          return { status: "uploaded", item: await completeRes.json() };
        };

        /* ── Try online, fall back to queue ── */
        try {
          if (!navigator.onLine) throw new TypeError("offline");
          return await attemptUpload();
        } catch (err) {
          if (!isNetworkError(err)) throw err; // real server error — don't queue

          await enqueueUpload({
            id: crypto.randomUUID(),
            encryptedBlob,
            thumbnailBlob,
            fileName: file.name,
            mimeType: file.type,
            originalFileSize: file.size,
            uploadMeta,
            createdAt: Date.now(),
          });
          await requestBackgroundSync();
          return { status: "queued" };
        }
      } finally {
        guardOff();
      }
    },
    onSuccess: (result) => {
      if (result.status === "uploaded") {
        queryClient.invalidateQueries({ queryKey: ["media"] });
      }
    },
  });
}
