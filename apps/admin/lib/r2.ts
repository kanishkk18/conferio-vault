import "server-only";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { serverEnv } from "./env";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${serverEnv.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: serverEnv.R2_ACCESS_KEY_ID,
    secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY,
  },
});

/** Fetches an object's bytes directly (not a presigned URL — this app decrypts server-side, so it needs the bytes itself). */
export async function fetchObjectBytes(storageKey: string): Promise<ArrayBuffer> {
  const command = new GetObjectCommand({ Bucket: serverEnv.R2_BUCKET_NAME, Key: storageKey });
  const response = await r2Client.send(command);
  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) throw new Error(`Object ${storageKey} not found or empty`);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
