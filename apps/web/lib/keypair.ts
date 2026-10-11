"use client";

import { VaultEncryption } from "@securevault/encryption";

interface StoredKeypair {
  hasKeypair: boolean;
  publicKey?: string;
  wrappedPrivateKey?: string;
  privateKeyIv?: string;
}

async function fetchStoredKeypair(): Promise<StoredKeypair> {
  const res = await fetch("/api/user/keypair");
  if (!res.ok) throw new Error("Failed to check keypair");
  return res.json();
}

/**
 * Ensures the current user has an ECDH keypair, generating and storing one
 * (public key + master-key-wrapped private key) if this is their first
 * time sharing anything. Returns the raw public key (base64) and the
 * unwrapped private CryptoKey, ready to derive shared secrets with.
 */
export async function ensureKeypair(
  masterKey: CryptoKey
): Promise<{ publicKey: string; privateKey: CryptoKey }> {
  const existing = await fetchStoredKeypair();

  if (existing.hasKeypair && existing.publicKey && existing.wrappedPrivateKey && existing.privateKeyIv) {
    const privateKey = await VaultEncryption.unwrapPrivateKey(
      { wrapped: existing.wrappedPrivateKey, iv: existing.privateKeyIv },
      masterKey
    );
    return { publicKey: existing.publicKey, privateKey };
  }

  const keyPair = await VaultEncryption.generateEcdhKeyPair();
  const publicKey = await VaultEncryption.exportPublicKeyRaw(keyPair.publicKey);
  const wrapped = await VaultEncryption.wrapPrivateKey(keyPair.privateKey, masterKey);

  const res = await fetch("/api/user/keypair", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey,
      wrappedPrivateKey: wrapped.wrapped,
      privateKeyIv: wrapped.iv,
    }),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error("Failed to set up sharing keys");
  }

  return { publicKey, privateKey: keyPair.privateKey };
}
