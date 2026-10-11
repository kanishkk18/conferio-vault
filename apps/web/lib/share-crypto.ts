import { VaultEncryption } from "@securevault/encryption";

export interface LinkShareResult {
  wrappedKeyForShare: string;
  shareKeyIv: string;
  shareKeySalt?: string;
  /** Only set for password-less links — goes in the URL fragment, never sent to the server. */
  fragmentKey?: string;
}

/**
 * Wraps an item key for link sharing. Without a password, generates a
 * standalone AES key that the caller must put in the URL fragment
 * (`#key=...`) — fragments are never transmitted in HTTP requests, so the
 * server only ever sees the wrapped (useless without that key) blob. With
 * a password, derives the wrapping key from it instead (PBKDF2), and no
 * fragment is needed since the recipient re-derives it from the password.
 */
export async function wrapKeyForLinkShare(
  itemKey: CryptoKey,
  sharePassword?: string
): Promise<LinkShareResult> {
  if (sharePassword) {
    const salt = VaultEncryption.generateSalt();
    const shareKey = await VaultEncryption.deriveShareKey(sharePassword, salt);
    const wrapped = await VaultEncryption.wrapItemKey(itemKey, shareKey);
    return { wrappedKeyForShare: wrapped.wrapped, shareKeyIv: wrapped.iv, shareKeySalt: salt };
  }

  const linkKey = await VaultEncryption.generateItemKey();
  const wrapped = await VaultEncryption.wrapItemKey(itemKey, linkKey);
  const fragmentKey = await VaultEncryption.exportKeyRaw(linkKey);
  return { wrappedKeyForShare: wrapped.wrapped, shareKeyIv: wrapped.iv, fragmentKey };
}

/** Unwraps an item key from a password-less link share, given the fragment key. */
export async function unwrapLinkShareKeyless(
  wrappedKeyForShare: string,
  shareKeyIv: string,
  fragmentKey: string
): Promise<CryptoKey> {
  const linkKey = await VaultEncryption.importKeyRaw(fragmentKey);
  return VaultEncryption.unwrapItemKey({ wrapped: wrappedKeyForShare, iv: shareKeyIv }, linkKey);
}

/** Unwraps an item key from a password-protected link share. */
export async function unwrapLinkSharePassword(
  wrappedKeyForShare: string,
  shareKeyIv: string,
  shareKeySalt: string,
  sharePassword: string
): Promise<CryptoKey> {
  const shareKey = await VaultEncryption.deriveShareKey(sharePassword, shareKeySalt);
  return VaultEncryption.unwrapItemKey({ wrapped: wrappedKeyForShare, iv: shareKeyIv }, shareKey);
}

/** Wraps an item key for a specific recipient using ECDH — the server never sees the shared secret. */
export async function wrapKeyForUserShare(
  itemKey: CryptoKey,
  ownPrivateKey: CryptoKey,
  recipientPublicKeyBase64: string
): Promise<{ wrappedKeyForShare: string; shareKeyIv: string }> {
  const recipientPublicKey = await VaultEncryption.importPublicKeyRaw(recipientPublicKeyBase64);
  const sharedKey = await VaultEncryption.deriveEcdhSharedKey(ownPrivateKey, recipientPublicKey);
  const wrapped = await VaultEncryption.wrapItemKey(itemKey, sharedKey);
  return { wrappedKeyForShare: wrapped.wrapped, shareKeyIv: wrapped.iv };
}

/** Recipient-side: derives the same shared secret and unwraps the item key. */
export async function unwrapUserShareKey(
  wrappedKeyForShare: string,
  shareKeyIv: string,
  ownPrivateKey: CryptoKey,
  senderPublicKeyBase64: string
): Promise<CryptoKey> {
  const senderPublicKey = await VaultEncryption.importPublicKeyRaw(senderPublicKeyBase64);
  const sharedKey = await VaultEncryption.deriveEcdhSharedKey(ownPrivateKey, senderPublicKey);
  return VaultEncryption.unwrapItemKey({ wrapped: wrappedKeyForShare, iv: shareKeyIv }, sharedKey);
}
