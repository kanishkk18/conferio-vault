import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { serverEnv } from "./env.server";

/**
 * R2 is S3-compatible, so the standard AWS SDK works against it — just
 * point `endpoint` at the account-scoped R2 URL and set `region: "auto"`.
 * This client makes plain HTTPS calls to Cloudflare's API; it has no
 * dependency on any particular hosting platform. Whether this Next.js app
 * runs as Vercel serverless functions or as a long-running Node process
 * on a self-hosted VPS (e.g. behind Dokploy on Hostinger), the exact same
 * code path executes the same requests as long as the R2_* env vars are
 * set on that host.
 */
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${serverEnv.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: serverEnv.R2_ACCESS_KEY_ID,
    secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY,
  },
});

const PRESIGNED_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes

/** Generates a random, non-identifying object key — no user info, no original filename. */
export function generateStorageKey(): string {
  return randomUUID();
}

/**
 * Presigned PUT URL for a direct browser → R2 upload of an already
 * client-side-encrypted blob. content-type is always
 * application/octet-stream — the server never learns (and R2 never
 * content-type-sniffs) the real file type, since that's part of the
 * encrypted payload metadata, not the blob itself.
 */
export async function getUploadPresignedUrl(storageKey: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: serverEnv.R2_BUCKET_NAME,
    Key: storageKey,
    ContentType: "application/octet-stream",
  });
  return getSignedUrl(r2Client, command, { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS });
}

export async function getDownloadPresignedUrl(storageKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: serverEnv.R2_BUCKET_NAME,
    Key: storageKey,
  });
  return getSignedUrl(r2Client, command, { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS });
}

export async function deleteObject(storageKey: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: serverEnv.R2_BUCKET_NAME, Key: storageKey })
  );
}

export { r2Client };
