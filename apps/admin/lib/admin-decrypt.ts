import "server-only";
import { VaultEncryption } from "@securevault/encryption";
import { serverEnv } from "./env";
import { fetchObjectBytes } from "./r2";

let cachedMasterKey: CryptoKey | null = null;

async function getAdminMasterKey(): Promise<CryptoKey> {
  if (!cachedMasterKey) {
    cachedMasterKey = await VaultEncryption.importKeyRaw(serverEnv.ADMIN_MASTER_KEY);
  }
  return cachedMasterKey;
}

interface EscrowedMediaItem {
  storageKey: string;
  thumbnailKey: string | null;
  adminWrappedKey: string | null;
  adminKeyIv: string | null;
  iv: string;
  thumbnailIv: string | null;
  chunkSize: number;
  chunkCount: number;
  mimeType: string;
}

async function resolveFileKey(item: EscrowedMediaItem): Promise<CryptoKey> {
  if (!item.adminWrappedKey || !item.adminKeyIv) {
    throw new Error("This item has no admin-escrowed key (uploaded before this feature existed?)");
  }
  const masterKey = await getAdminMasterKey();
  return VaultEncryption.unwrapItemKey(
    { wrapped: item.adminWrappedKey, iv: item.adminKeyIv },
    masterKey
  );
}

export async function decryptMediaForAdmin(item: EscrowedMediaItem): Promise<Blob> {
  const fileKey = await resolveFileKey(item);
  const encryptedBytes = await fetchObjectBytes(item.storageKey);
  return VaultEncryption.decryptFile(
    new Blob([encryptedBytes]),
    fileKey,
    item.iv,
    item.chunkSize,
    item.chunkCount,
    item.mimeType
  );
}

export async function decryptThumbnailForAdmin(item: EscrowedMediaItem): Promise<Blob | null> {
  if (!item.thumbnailKey || !item.thumbnailIv) return null;
  const fileKey = await resolveFileKey(item);
  const encryptedBytes = await fetchObjectBytes(item.thumbnailKey);
  const plaintext = await VaultEncryption.decryptBuffer(encryptedBytes, fileKey, item.thumbnailIv);
  return new Blob([plaintext], { type: "image/jpeg" });
}
