/**
 * Client-side only. These utilities assume the Web Crypto API
 * (`crypto.subtle`) is available — i.e. a browser or a secure context.
 * Never import this file into a server component or API route.
 */

export function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  const chunkSize = 0x8000; // avoid call-stack blowups on large buffers
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64ToBuf(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Derives a per-chunk IV from a 12-byte base IV and a chunk index, by
 * XOR-ing the index into the last 4 bytes (a standard counter-in-IV
 * construction). This guarantees a unique IV per chunk under the same key
 * without having to generate/store one IV per chunk, which is required —
 * reusing a single AES-GCM IV across multiple ciphertexts under the same
 * key breaks its authentication guarantees.
 */
export function deriveChunkIv(
  baseIv: Uint8Array<ArrayBuffer>,
  chunkIndex: number
): Uint8Array<ArrayBuffer> {
  const iv = new Uint8Array(new ArrayBuffer(baseIv.length));
  iv.set(baseIv);
  const view = new DataView(iv.buffer);
  const counterOffset = iv.length - 4;
  const current = view.getUint32(counterOffset, false);
  view.setUint32(counterOffset, current ^ chunkIndex, false);
  return iv;
}
