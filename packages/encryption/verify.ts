/**
 * Standalone correctness test for VaultEncryption, run with tsx (Node's
 * Web Crypto / Blob / File globals are used identically to a browser).
 * This is not part of the app — just a one-off verification script.
 */
import { VaultEncryption, DEFAULT_CHUNK_SIZE } from "./src/index";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function randomFillLarge(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const maxPerCall = 65536;
  for (let offset = 0; offset < length; offset += maxPerCall) {
    const end = Math.min(offset + maxPerCall, length);
    crypto.getRandomValues(bytes.subarray(offset, end));
  }
  return bytes;
}

async function main() {
  console.log("1) Master key derivation is deterministic given the same password+salt");
  const salt = VaultEncryption.generateSalt();
  const masterKey1 = await VaultEncryption.deriveMasterKey("correct horse battery staple", salt);
  const masterKey2 = await VaultEncryption.deriveMasterKey("correct horse battery staple", salt);
  // CryptoKey objects aren't directly comparable, so prove equivalence by
  // encrypting with one and decrypting with the other.
  const probe = await VaultEncryption.encryptString("probe", masterKey1);
  const decryptedWithKey2 = await VaultEncryption.decryptString(probe, masterKey2);
  assert(decryptedWithKey2 === "probe", "same password+salt derives an equivalent key");

  console.log("\n2) Wrong password produces a different (non-working) key");
  const wrongKey = await VaultEncryption.deriveMasterKey("wrong password", salt);
  let wrongKeyFailed = false;
  try {
    await VaultEncryption.decryptString(probe, wrongKey);
  } catch {
    wrongKeyFailed = true;
  }
  assert(wrongKeyFailed, "decrypting with the wrong password throws (AES-GCM auth tag mismatch)");

  console.log("\n3) Item key generation, wrapping, and unwrapping round-trips");
  const itemKey = await VaultEncryption.generateItemKey();
  const wrapped = await VaultEncryption.wrapItemKey(itemKey, masterKey1);
  const unwrapped = await VaultEncryption.unwrapItemKey(wrapped, masterKey1);
  const wrapRoundTrip = await VaultEncryption.encryptString("wrap-test", itemKey);
  const wrapDecrypted = await VaultEncryption.decryptString(wrapRoundTrip, unwrapped);
  assert(wrapDecrypted === "wrap-test", "unwrapped item key decrypts data encrypted with the original key");

  console.log("\n4) String / JSON encryption round-trips");
  const jsonPayload = { password: "hunter2", notes: "some notes with unicode: 日本語 🔒" };
  const encryptedJson = await VaultEncryption.encryptJSON(jsonPayload, itemKey);
  const decryptedJson = await VaultEncryption.decryptJSON<typeof jsonPayload>(encryptedJson, itemKey);
  assert(JSON.stringify(decryptedJson) === JSON.stringify(jsonPayload), "JSON payload round-trips exactly, including unicode");

  console.log("\n5) Raw buffer (thumbnail) encryption round-trips");
  const thumbBytes = crypto.getRandomValues(new Uint8Array(4096));
  const { ciphertext: thumbCipher, iv: thumbIv } = await VaultEncryption.encryptBuffer(
    thumbBytes.buffer,
    itemKey
  );
  const thumbPlain = await VaultEncryption.decryptBuffer(thumbCipher, itemKey, thumbIv);
  assert(
    Buffer.from(thumbPlain).equals(Buffer.from(thumbBytes.buffer)),
    "decrypted buffer matches original byte-for-byte"
  );

  console.log("\n6) Chunked file encryption round-trips across multiple chunks");
  const chunkSize = 256 * 1024; // small chunk size to force many chunks in a test-sized file
  const fileBytes = randomFillLarge(chunkSize * 3 + 12345); // 3 full chunks + a partial one
  const originalFile = new File([fileBytes], "test.bin", { type: "application/octet-stream" });

  const encryptResult = await VaultEncryption.encryptFile(originalFile, itemKey, undefined, chunkSize);
  assert(encryptResult.chunkCount === 4, `chunk count is correct (expected 4, got ${encryptResult.chunkCount})`);

  const decryptedBlob = await VaultEncryption.decryptFile(
    encryptResult.blob,
    itemKey,
    encryptResult.baseIv,
    encryptResult.chunkSize,
    encryptResult.chunkCount,
    "application/octet-stream"
  );
  const decryptedBytes = new Uint8Array(await decryptedBlob.arrayBuffer());
  assert(
    Buffer.from(decryptedBytes).equals(Buffer.from(fileBytes)),
    `decrypted file matches original byte-for-byte (${fileBytes.length} bytes)`
  );

  console.log("\n7) Per-chunk IVs are actually distinct (the bug fixed from the original spec)");
  // Re-derive the IVs the same way encryptFile does internally, by
  // checking chunk ciphertexts differ even for identical plaintext chunks.
  const repeatedByte = new Uint8Array(chunkSize).fill(7);
  const repeatedFile = new File([repeatedByte, repeatedByte], "repeated.bin");
  const repeatedEncrypted = await VaultEncryption.encryptFile(repeatedFile, itemKey, undefined, chunkSize);
  const rawCipherBytes = new Uint8Array(await repeatedEncrypted.blob.arrayBuffer());
  const chunkCipherLen = chunkSize + 16; // + GCM tag
  const firstChunkCipher = rawCipherBytes.slice(0, chunkCipherLen);
  const secondChunkCipher = rawCipherBytes.slice(chunkCipherLen, chunkCipherLen * 2);
  assert(
    !Buffer.from(firstChunkCipher).equals(Buffer.from(secondChunkCipher)),
    "two chunks with identical plaintext produce different ciphertext (distinct IVs, not reused)"
  );

  console.log("\n8) Tampering with ciphertext is detected (AES-GCM authentication)");
  const tamperedBytes = new Uint8Array(rawCipherBytes);
  tamperedBytes[0] = tamperedBytes[0]! ^ 0xff; // flip bits in the first byte
  const tamperedBlob = new Blob([tamperedBytes]);
  let tamperDetected = false;
  try {
    await VaultEncryption.decryptFile(
      tamperedBlob,
      itemKey,
      repeatedEncrypted.baseIv,
      repeatedEncrypted.chunkSize,
      repeatedEncrypted.chunkCount,
      "application/octet-stream"
    );
  } catch {
    tamperDetected = true;
  }
  assert(tamperDetected, "tampered ciphertext fails authentication instead of silently decrypting garbage");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

async function testAdminEscrow() {
  console.log("\n11) Admin key escrow: raw-export → wrap → unwrap → decrypt round-trips");
  const fileKey = await VaultEncryption.generateItemKey();
  const chunkSize = 256 * 1024;
  const fileBytes = randomFillLarge(chunkSize + 999);
  const file = new File([fileBytes], "escrow-test.bin");
  const encrypted = await VaultEncryption.encryptFile(file, fileKey, undefined, chunkSize);

  // Simulates what apps/web/lib/admin-escrow.ts does at upload time: the
  // master key is imported once from a base64 secret (here, simulated by
  // exporting a freshly generated key — in production this is
  // ADMIN_MASTER_KEY from the environment).
  const adminMasterKeyBase64 = await VaultEncryption.exportKeyRaw(await VaultEncryption.generateItemKey());
  const adminMasterKey = await VaultEncryption.importKeyRaw(adminMasterKeyBase64);
  const rawFileKeyBase64 = await VaultEncryption.exportKeyRaw(fileKey);
  const reimportedFileKey = await VaultEncryption.importKeyRaw(rawFileKeyBase64);
  const escrowWrapped = await VaultEncryption.wrapItemKey(reimportedFileKey, adminMasterKey);

  // Simulates what apps/admin/lib/admin-decrypt.ts does at view time.
  const unwrappedFileKey = await VaultEncryption.unwrapItemKey(escrowWrapped, adminMasterKey);
  const decryptedBlob = await VaultEncryption.decryptFile(
    encrypted.blob,
    unwrappedFileKey,
    encrypted.baseIv,
    encrypted.chunkSize,
    encrypted.chunkCount,
    "application/octet-stream"
  );
  const decryptedBytes = new Uint8Array(await decryptedBlob.arrayBuffer());
  assert(
    Buffer.from(decryptedBytes).equals(Buffer.from(fileBytes)),
    "admin-escrow-unwrapped key decrypts the file identically to the owner's own key"
  );

  console.log(`\n${passed} passed, ${failed} failed (cumulative)`);
  if (failed > 0) process.exit(1);
}

async function testEcdhSharing() {
  console.log("\n9) ECDH sharing: two independent keypairs derive the same shared secret");
  const alice = await VaultEncryption.generateEcdhKeyPair();
  const bob = await VaultEncryption.generateEcdhKeyPair();

  const aliceMasterKey = await VaultEncryption.deriveMasterKey("alice-pw", VaultEncryption.generateSalt());
  const wrappedAlicePriv = await VaultEncryption.wrapPrivateKey(alice.privateKey, aliceMasterKey);
  const unwrappedAlicePriv = await VaultEncryption.unwrapPrivateKey(wrappedAlicePriv, aliceMasterKey);
  assert(true, "Alice's private key wraps/unwraps with her master key (no throw)");

  const alicePubRaw = await VaultEncryption.exportPublicKeyRaw(alice.publicKey);
  const bobPubRaw = await VaultEncryption.exportPublicKeyRaw(bob.publicKey);

  // Alice shares an item with Bob: derives shared secret from her private key + Bob's public key.
  const itemKey = await VaultEncryption.generateItemKey();
  const bobPublicKeyImported = await VaultEncryption.importPublicKeyRaw(bobPubRaw);
  const aliceSharedSecret = await VaultEncryption.deriveEcdhSharedKey(unwrappedAlicePriv, bobPublicKeyImported);
  const wrappedForBob = await VaultEncryption.wrapItemKey(itemKey, aliceSharedSecret);

  // Bob receives it: derives shared secret from HIS private key + Alice's public key.
  // Static ECDH is symmetric — this must equal Alice's derived secret above.
  const alicePublicKeyImported = await VaultEncryption.importPublicKeyRaw(alicePubRaw);
  const bobSharedSecret = await VaultEncryption.deriveEcdhSharedKey(bob.privateKey, alicePublicKeyImported);
  const unwrappedItemKey = await VaultEncryption.unwrapItemKey(wrappedForBob, bobSharedSecret);

  const probeEncrypted = await VaultEncryption.encryptString("ecdh-probe", itemKey);
  const probeDecrypted = await VaultEncryption.decryptString(probeEncrypted, unwrappedItemKey);
  assert(probeDecrypted === "ecdh-probe", "Bob's independently-derived shared secret unwraps the same item key Alice wrapped");

  console.log("\n10) A third party's keypair cannot derive the same shared secret");
  const eve = await VaultEncryption.generateEcdhKeyPair();
  const eveSharedSecret = await VaultEncryption.deriveEcdhSharedKey(eve.privateKey, alicePublicKeyImported);
  let eveFailed = false;
  try {
    await VaultEncryption.unwrapItemKey(wrappedForBob, eveSharedSecret);
  } catch {
    eveFailed = true;
  }
  assert(eveFailed, "an unrelated keypair cannot unwrap a share meant for someone else");

  console.log(`\n${passed} passed, ${failed} failed (cumulative)`);
  if (failed > 0) process.exit(1);
}

main()
  .then(testEcdhSharing)
  .then(testAdminEscrow)
  .catch((err) => {
    console.error("Test script crashed:", err);
    process.exit(1);
  });
