/**
 * Client-side encryption for SecureVault.
 *
 * Zero-knowledge design: everything in this file runs in the browser.
 * The server never receives a plaintext password, plaintext file bytes,
 * a master key, or an unwrapped data/file key. Only ciphertext, IVs,
 * salts, and wrapped keys ever cross the network.
 *
 * DO NOT import this module in a server component, route handler, or any
 * file that runs on the server — `crypto.subtle` in Node has a different
 * shape for some operations and none of the key material here is meant
 * to exist server-side even transiently.
 */

import { bufToBase64, base64ToBuf, randomBytes, deriveChunkIv } from "./encoding";

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits, the recommended IV size for AES-GCM
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 600_000; // OWASP 2024+ recommendation for PBKDF2-SHA256
export const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB per chunk

export interface WrappedKey {
  wrapped: string; // base64
  iv: string; // base64
}

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
}

export interface EncryptedFileResult {
  blob: Blob;
  baseIv: string; // base64
  chunkSize: number;
  chunkCount: number;
}

export class VaultEncryption {
  // ---------------------------------------------------------------------
  // Salts & master key derivation
  // ---------------------------------------------------------------------

  /** Generates a new random salt for PBKDF2, base64-encoded for storage. */
  static generateSalt(): string {
    return bufToBase64(randomBytes(SALT_LENGTH));
  }

  /**
   * Derives the user's master key from their vault password + stored salt.
   * The master key is non-extractable — it can wrap/unwrap other keys but
   * its raw bytes can never be read back out of the CryptoKey object,
   * even by this code.
   */
  static async deriveMasterKey(password: string, saltBase64: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const salt = base64ToBuf(saltBase64);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false, // non-extractable
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
  }

  // ---------------------------------------------------------------------
  // Per-item data/file keys
  // ---------------------------------------------------------------------

  /** Generates a new random AES-256-GCM key for a single item (password entry or file). */
  static async generateItemKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH },
      true, // extractable — must be, so it can be wrapped for storage
      ["encrypt", "decrypt"]
    );
  }

  /** Wraps (encrypts) an item key with the master key, for storage server-side. */
  static async wrapItemKey(itemKey: CryptoKey, masterKey: CryptoKey): Promise<WrappedKey> {
    const iv = randomBytes(IV_LENGTH);
    const wrapped = await crypto.subtle.wrapKey("raw", itemKey, masterKey, {
      name: ALGORITHM,
      iv,
    });
    return { wrapped: bufToBase64(wrapped), iv: bufToBase64(iv) };
  }

  /** Unwraps a stored item key using the master key. */
  static async unwrapItemKey(
    wrapped: WrappedKey,
    masterKey: CryptoKey
  ): Promise<CryptoKey> {
    return crypto.subtle.unwrapKey(
      "raw",
      base64ToBuf(wrapped.wrapped),
      masterKey,
      { name: ALGORITHM, iv: base64ToBuf(wrapped.iv) },
      { name: ALGORITHM, length: KEY_LENGTH },
      true,
      ["encrypt", "decrypt"]
    );
  }

  // ---------------------------------------------------------------------
  // String payloads (password entries, notes, etc.)
  // ---------------------------------------------------------------------

  static async encryptString(plaintext: string, key: CryptoKey): Promise<EncryptedPayload> {
    const iv = randomBytes(IV_LENGTH);
    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoder.encode(plaintext)
    );
    return { ciphertext: bufToBase64(ciphertext), iv: bufToBase64(iv) };
  }

  static async decryptString(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: base64ToBuf(payload.iv) },
      key,
      base64ToBuf(payload.ciphertext)
    );
    return new TextDecoder().decode(plaintext);
  }

  /** Convenience helper for encrypting a JSON-serializable object (e.g. a password entry). */
  static async encryptJSON<T>(data: T, key: CryptoKey): Promise<EncryptedPayload> {
    return this.encryptString(JSON.stringify(data), key);
  }

  static async decryptJSON<T>(payload: EncryptedPayload, key: CryptoKey): Promise<T> {
    return JSON.parse(await this.decryptString(payload, key)) as T;
  }

  /** Encrypts a raw binary payload (e.g. a thumbnail) in one shot — for anything small enough not to need chunking. */
  static async encryptBuffer(
    data: ArrayBuffer,
    key: CryptoKey
  ): Promise<{ ciphertext: ArrayBuffer; iv: string }> {
    const iv = randomBytes(IV_LENGTH);
    const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, data);
    return { ciphertext, iv: bufToBase64(iv) };
  }

  static async decryptBuffer(
    ciphertext: ArrayBuffer,
    key: CryptoKey,
    ivBase64: string
  ): Promise<ArrayBuffer> {
    return crypto.subtle.decrypt(
      { name: ALGORITHM, iv: base64ToBuf(ivBase64) },
      key,
      ciphertext
    );
  }

  // ---------------------------------------------------------------------
  // Chunked file encryption (for media uploads of arbitrary size)
  // ---------------------------------------------------------------------

  /**
   * Encrypts a File in fixed-size chunks so large uploads (video, etc.)
   * don't require holding the whole plaintext + whole ciphertext in memory
   * twice. Each chunk gets a distinct IV derived from a single random base
   * IV, so no IV is ever reused under the same key (see deriveChunkIv).
   */
  static async encryptFile(
    file: File,
    key: CryptoKey,
    onProgress?: (percent: number) => void,
    chunkSize: number = DEFAULT_CHUNK_SIZE
  ): Promise<EncryptedFileResult> {
    const baseIv = randomBytes(IV_LENGTH);
    const chunkCount = Math.max(1, Math.ceil(file.size / chunkSize));
    const encryptedChunks: ArrayBuffer[] = [];

    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = await file.slice(start, end).arrayBuffer();
      const iv = deriveChunkIv(baseIv, i);

      const encryptedChunk = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, chunk);
      encryptedChunks.push(encryptedChunk);
      onProgress?.(Math.round(((i + 1) / chunkCount) * 100));
    }

    // Each encrypted chunk carries its own 16-byte GCM auth tag appended by
    // subtle.encrypt, so chunk boundaries are recoverable on decrypt as long
    // as chunkSize (plaintext) and chunkCount are known — both are stored
    // as MediaItem metadata alongside baseIv.
    return {
      blob: new Blob(encryptedChunks),
      baseIv: bufToBase64(baseIv),
      chunkSize,
      chunkCount,
    };
  }

  /**
   * Decrypts a chunked-encrypted file back into a plaintext Blob.
   * `encryptedChunkSize` is the ciphertext size of a full chunk
   * (plaintext chunkSize + 16-byte GCM tag) used to locate chunk
   * boundaries in the downloaded blob.
   */
  static async decryptFile(
    encryptedBlob: Blob,
    key: CryptoKey,
    baseIvBase64: string,
    chunkSize: number,
    chunkCount: number,
    mimeType: string,
    onProgress?: (percent: number) => void
  ): Promise<Blob> {
    const baseIv = base64ToBuf(baseIvBase64);
    const GCM_TAG_LENGTH = 16;
    const encryptedChunkSize = chunkSize + GCM_TAG_LENGTH;
    const decryptedChunks: ArrayBuffer[] = [];

    for (let i = 0; i < chunkCount; i++) {
      const start = i * encryptedChunkSize;
      const end = Math.min(start + encryptedChunkSize, encryptedBlob.size);
      const chunk = await encryptedBlob.slice(start, end).arrayBuffer();
      const iv = deriveChunkIv(baseIv, i);

      const decryptedChunk = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, chunk);
      decryptedChunks.push(decryptedChunk);
      onProgress?.(Math.round(((i + 1) / chunkCount) * 100));
    }

    return new Blob(decryptedChunks, { type: mimeType });
  }

  // ---------------------------------------------------------------------
  // Share-link password protection
  // ---------------------------------------------------------------------

  /**
   * Derives a key from a share-link password (separate from the owner's
   * vault password) so a shared item's key can be re-wrapped for a
   * password-protected link without ever exposing the owner's master key.
   */
  static async deriveShareKey(sharePassword: string, saltBase64: string): Promise<CryptoKey> {
    return this.deriveMasterKey(sharePassword, saltBase64);
  }

  // ---------------------------------------------------------------------
  // Link shares: a standalone AES key that travels in the URL fragment
  // (never sent to the server — fragments aren't transmitted in HTTP
  // requests), used to wrap the item key for password-less link sharing.
  // ---------------------------------------------------------------------

  static async exportKeyRaw(key: CryptoKey): Promise<string> {
    const raw = await crypto.subtle.exportKey("raw", key);
    return bufToBase64(raw);
  }

  static async importKeyRaw(base64Key: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      base64ToBuf(base64Key),
      { name: ALGORITHM, length: KEY_LENGTH },
      true,
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
  }

  // ---------------------------------------------------------------------
  // ECDH keypairs, for user-to-user sharing without a link or password.
  // Each user has a static P-256 keypair: the public key is safe to hand
  // to other users; the private key is wrapped with that user's own
  // master key before it's ever sent to the server. To share an item with
  // another user, the sender derives a shared secret from their own
  // private key + the recipient's public key (ECDH) and wraps the item
  // key with it. The recipient derives the *same* shared secret from
  // their private key + the sender's public key and unwraps it — the
  // server only ever handles public keys and ciphertext.
  // ---------------------------------------------------------------------

  static async generateEcdhKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
      "deriveKey",
      "deriveBits",
    ]) as Promise<CryptoKeyPair>;
  }

  static async exportPublicKeyRaw(publicKey: CryptoKey): Promise<string> {
    const raw = await crypto.subtle.exportKey("raw", publicKey);
    return bufToBase64(raw);
  }

  static async importPublicKeyRaw(base64Key: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      base64ToBuf(base64Key),
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );
  }

  /** Wraps the ECDH private key with the master key, for storage server-side. */
  static async wrapPrivateKey(privateKey: CryptoKey, masterKey: CryptoKey): Promise<WrappedKey> {
    const iv = randomBytes(IV_LENGTH);
    const wrapped = await crypto.subtle.wrapKey("pkcs8", privateKey, masterKey, {
      name: ALGORITHM,
      iv,
    });
    return { wrapped: bufToBase64(wrapped), iv: bufToBase64(iv) };
  }

  static async unwrapPrivateKey(wrapped: WrappedKey, masterKey: CryptoKey): Promise<CryptoKey> {
    return crypto.subtle.unwrapKey(
      "pkcs8",
      base64ToBuf(wrapped.wrapped),
      masterKey,
      { name: ALGORITHM, iv: base64ToBuf(wrapped.iv) },
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );
  }

  /** Derives the AES-256-GCM shared secret between one party's private key and the other's public key. */
  static async deriveEcdhSharedKey(
    privateKey: CryptoKey,
    peerPublicKey: CryptoKey
  ): Promise<CryptoKey> {
    return crypto.subtle.deriveKey(
      { name: "ECDH", public: peerPublicKey },
      privateKey,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ["wrapKey", "unwrapKey"]
    );
  }
}

export { bufToBase64, base64ToBuf, randomBytes } from "./encoding";
