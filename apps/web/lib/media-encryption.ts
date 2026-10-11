import { VaultEncryption } from "@securevault/encryption";

/** Downscales an image client-side into a small JPEG thumbnail before encryption. Returns null for non-image files (e.g. video — thumbnailing those is a follow-up; they fall back to a generic icon in the UI). */
export async function generateThumbnail(file: File, maxDimension = 320): Promise<Blob | null> {
  if (!file.type.startsWith("image/")) return null;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
  });
}

export interface FileKeyWrapResult {
  requiresPassword: false;
  encryptedFileKey: string;
  keyIv: string;
}

export interface FilePasswordWrapResult {
  requiresPassword: true;
  viewKeySalt: string;
  viewWrappedKey: string;
  viewKeyIv: string;
}

/**
 * Wraps a freshly generated file key either with the master key (normal
 * case) or with a key derived from a file-specific password. In the
 * password-protected case, the wrapped-with-master-key copy is
 * deliberately never created or sent — see MediaItem.requiresPassword.
 */
export async function wrapFileKey(
  fileKey: CryptoKey,
  options: { masterKey: CryptoKey } | { filePassword: string }
): Promise<FileKeyWrapResult | FilePasswordWrapResult> {
  if ("filePassword" in options) {
    const salt = VaultEncryption.generateSalt();
    const derivedKey = await VaultEncryption.deriveMasterKey(options.filePassword, salt);
    const wrapped = await VaultEncryption.wrapItemKey(fileKey, derivedKey);
    return {
      requiresPassword: true,
      viewKeySalt: salt,
      viewWrappedKey: wrapped.wrapped,
      viewKeyIv: wrapped.iv,
    };
  }

  const wrapped = await VaultEncryption.wrapItemKey(fileKey, options.masterKey);
  return { requiresPassword: false, encryptedFileKey: wrapped.wrapped, keyIv: wrapped.iv };
}

/** Unwraps a normal (master-key-protected) file's key. */
export async function unwrapNormalFileKey(
  encryptedFileKey: string,
  keyIv: string,
  masterKey: CryptoKey
): Promise<CryptoKey> {
  return VaultEncryption.unwrapItemKey({ wrapped: encryptedFileKey, iv: keyIv }, masterKey);
}

/** Unwraps a password-protected file's key given the file's own password. */
export async function unwrapProtectedFileKey(
  viewWrappedKey: string,
  viewKeyIv: string,
  viewKeySalt: string,
  filePassword: string
): Promise<CryptoKey> {
  const derivedKey = await VaultEncryption.deriveMasterKey(filePassword, viewKeySalt);
  return VaultEncryption.unwrapItemKey({ wrapped: viewWrappedKey, iv: viewKeyIv }, derivedKey);
}
