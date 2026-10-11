"use client";

import { VaultEncryption } from "@securevault/encryption";
import type { PasswordVaultData } from "@securevault/shared-types";
import type { PasswordListItem } from "./use-passwords";

export class VaultUnlockError extends Error {
  constructor(message = "Couldn't decrypt this item — your vault password may be incorrect.") {
    super(message);
    this.name = "VaultUnlockError";
  }
}

/** Resolves just the unwrapped item key (e.g. for sharing), without decrypting the payload. */
export async function getPasswordItemKey(
  item: PasswordListItem,
  masterKey: CryptoKey
): Promise<CryptoKey> {
  try {
    return await VaultEncryption.unwrapItemKey(
      { wrapped: item.encryptedDataKey, iv: item.keyIv },
      masterKey
    );
  } catch {
    throw new VaultUnlockError();
  }
}

/**
 * Unwraps the item's data key with the master key, then decrypts the
 * item's password/notes payload. Throws VaultUnlockError if the master
 * key is wrong (AES-GCM auth tag mismatch) — this is the only signal we
 * get that a derived key is invalid, since there's no separate
 * server-side verification of the vault password.
 */
export async function revealPassword(
  item: PasswordListItem,
  masterKey: CryptoKey
): Promise<PasswordVaultData> {
  try {
    const itemKey = await VaultEncryption.unwrapItemKey(
      { wrapped: item.encryptedDataKey, iv: item.keyIv },
      masterKey
    );
    return await VaultEncryption.decryptJSON<PasswordVaultData>(
      { ciphertext: item.encryptedData, iv: item.iv },
      itemKey
    );
  } catch {
    throw new VaultUnlockError();
  }
}
