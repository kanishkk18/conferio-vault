import "server-only";
import { z } from "zod";

/**
 * The admin app deliberately does NOT validate/use R2 credentials — it
 * has no legitimate reason to ever fetch a file's ciphertext, let alone
 * decrypt it (it has no user's master key to do so anyway). Keeping R2
 * config out of this app entirely means there's no code path here that
 * could even attempt to reach storage.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  ADMIN_APP_URL: z.string().url(),

  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Needed here (and only here + the web app) to decrypt media for admin
  // viewing. R2 itself still only ever stores ciphertext; this app reads
  // that ciphertext and decrypts it in memory, on demand, per request.
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),

  // Must match the web app's ADMIN_MASTER_KEY exactly — same base64
  // 32-byte AES-256 key, e.g. `openssl rand -base64 32`.
  ADMIN_MASTER_KEY: z.string().min(1),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function loadServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables — see console output above.");
  }
  return parsed.data;
}

export const serverEnv = loadServerEnv();
