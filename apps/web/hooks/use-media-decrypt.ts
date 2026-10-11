import { VaultEncryption } from "@securevault/encryption";
import {
  unwrapNormalFileKey,
  unwrapProtectedFileKey,
} from "@/lib/media-encryption";
import type { MediaListItem } from "./use-media";

export class MediaUnlockError extends Error {
  constructor(message = "Couldn't decrypt this file — the password may be incorrect.") {
    super(message);
    this.name = "MediaUnlockError";
  }
}

interface MediaDetail extends MediaListItem {
  downloadUrl: string;
  thumbnailUrl: string | null;
}

async function fetchMediaDetail(id: string): Promise<MediaDetail> {
  const res = await fetch(`/api/media/${id}`);
  if (!res.ok) throw new Error("Failed to load file");
  return res.json();
}

/** Resolves the file key for a normal (non-protected) item using the already-unlocked master key. */
export async function getFileKeyForNormalItem(
  item: MediaListItem,
  masterKey: CryptoKey
): Promise<CryptoKey> {
  if (!item.encryptedFileKey || !item.keyIv) {
    throw new Error("This item has no master-key-wrapped key — is it password-protected?");
  }
  try {
    return await unwrapNormalFileKey(item.encryptedFileKey, item.keyIv, masterKey);
  } catch {
    throw new MediaUnlockError("Couldn't decrypt — your vault password may be incorrect.");
  }
}

/**
 * Resolves the file key for a password-protected item: first checks the
 * rate-limit budget and fetches the wrapped-key fields server-side, then
 * unwraps entirely client-side with the given password.
 */
export async function getFileKeyForProtectedItem(
  itemId: string,
  filePassword: string
): Promise<CryptoKey> {
  const res = await fetch(`/api/media/${itemId}/unlock`, { method: "POST" });
  if (res.status === 429) {
    const body = await res.json();
    throw new Error(body.error);
  }
  if (!res.ok) throw new Error("Failed to check unlock attempt");

  const { viewKeySalt, viewWrappedKey, viewKeyIv } = await res.json();
  try {
    return await unwrapProtectedFileKey(viewWrappedKey, viewKeyIv, viewKeySalt, filePassword);
  } catch {
    throw new MediaUnlockError();
  }
}

export async function decryptThumbnail(item: MediaListItem, fileKey: CryptoKey): Promise<string | null> {
  if (!item.thumbnailKey || !item.thumbnailIv) return null;
  const detail = await fetchMediaDetail(item.id);
  if (!detail.thumbnailUrl) return null;

  const res = await fetch(detail.thumbnailUrl);
  const ciphertext = await res.arrayBuffer();
  const plaintext = await VaultEncryption.decryptBuffer(ciphertext, fileKey, item.thumbnailIv);
  const blob = new Blob([plaintext], { type: "image/jpeg" });
  return URL.createObjectURL(blob);
}

export async function decryptFullFile(item: MediaListItem, fileKey: CryptoKey): Promise<Blob> {
  const detail = await fetchMediaDetail(item.id);
  const res = await fetch(detail.downloadUrl);
  const encryptedBlob = await res.blob();
  return VaultEncryption.decryptFile(
    encryptedBlob,
    fileKey,
    item.iv,
    item.chunkSize,
    item.chunkCount,
    item.mimeType
  );
}
