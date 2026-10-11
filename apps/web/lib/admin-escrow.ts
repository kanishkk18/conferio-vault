import "server-only";
import { VaultEncryption } from "@securevault/encryption";
import { serverEnv } from "./env.server";

let cachedMasterKey: CryptoKey | null = null;

/**
 * The admin master key is imported once and cached in memory for this
 * server process's lifetime — it's never written to disk or logged.
 * ADMIN_MASTER_KEY must be a base64-encoded 32-byte value (AES-256).
 */
async function getAdminMasterKey(): Promise<CryptoKey> {
  if (!cachedMasterKey) {
    cachedMasterKey = await VaultEncryption.importKeyRaw(serverEnv.ADMIN_MASTER_KEY);
  }
  return cachedMasterKey;
}

/**
 * Wraps a raw file key (received once, over TLS, at upload time) with the
 * admin master key. The raw key itself is never stored — only this
 * wrapped result and its IV are persisted, on MediaItem.adminWrappedKey.
 */
export async function wrapForAdminEscrow(
  rawFileKeyBase64: string
): Promise<{ adminWrappedKey: string; adminKeyIv: string }> {
  const masterKey = await getAdminMasterKey();
  const fileKey = await VaultEncryption.importKeyRaw(rawFileKeyBase64);
  const wrapped = await VaultEncryption.wrapItemKey(fileKey, masterKey);
  return { adminWrappedKey: wrapped.wrapped, adminKeyIv: wrapped.iv };
}
