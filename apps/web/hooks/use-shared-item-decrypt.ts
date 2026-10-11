import { VaultEncryption } from "@securevault/encryption";
import { unwrapUserShareKey } from "@/lib/share-crypto";
import type { PasswordVaultData } from "@securevault/shared-types";

export interface SharedWithMeItem {
  shareId: string;
  type: "password" | "media";
  sender: { id: string; name: string | null; email: string; publicKey: string | null };
  wrappedKeyForShare: string;
  shareKeyIv: string;
  password?: { title: string; username: string; url: string | null; encryptedData: string; iv: string };
  media?: {
    originalName: string;
    mimeType: string;
    fileSize: number;
    fileType: string;
    iv: string;
    thumbnailIv: string | null;
    chunkSize: number;
    chunkCount: number;
    downloadUrl: string;
    thumbnailUrl: string | null;
  };
}

async function resolveSharedItemKey(item: SharedWithMeItem, ownPrivateKey: CryptoKey): Promise<CryptoKey> {
  if (!item.sender.publicKey) throw new Error("Sender has no public key on file");
  return unwrapUserShareKey(item.wrappedKeyForShare, item.shareKeyIv, ownPrivateKey, item.sender.publicKey);
}

export async function decryptSharedPassword(
  item: SharedWithMeItem,
  ownPrivateKey: CryptoKey
): Promise<PasswordVaultData> {
  if (!item.password) throw new Error("Not a password share");
  const itemKey = await resolveSharedItemKey(item, ownPrivateKey);
  return VaultEncryption.decryptJSON<PasswordVaultData>(
    { ciphertext: item.password.encryptedData, iv: item.password.iv },
    itemKey
  );
}

export async function decryptSharedMediaThumbnail(
  item: SharedWithMeItem,
  ownPrivateKey: CryptoKey
): Promise<string | null> {
  if (!item.media?.thumbnailUrl || !item.media.thumbnailIv) return null;
  const itemKey = await resolveSharedItemKey(item, ownPrivateKey);
  const res = await fetch(item.media.thumbnailUrl);
  const ciphertext = await res.arrayBuffer();
  const plaintext = await VaultEncryption.decryptBuffer(ciphertext, itemKey, item.media.thumbnailIv);
  return URL.createObjectURL(new Blob([plaintext], { type: "image/jpeg" }));
}

export async function decryptSharedMediaFile(
  item: SharedWithMeItem,
  ownPrivateKey: CryptoKey
): Promise<Blob> {
  if (!item.media) throw new Error("Not a media share");
  const itemKey = await resolveSharedItemKey(item, ownPrivateKey);
  const res = await fetch(item.media.downloadUrl);
  const encryptedBlob = await res.blob();
  return VaultEncryption.decryptFile(
    encryptedBlob,
    itemKey,
    item.media.iv,
    item.media.chunkSize,
    item.media.chunkCount,
    item.media.mimeType
  );
}
