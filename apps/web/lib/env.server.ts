import "server-only";
import { z } from "zod";

/**
 * Validated at import time (module top-level), so a missing/malformed env
 * var crashes the server on boot with a clear message instead of failing
 * confusingly deep inside a request handler at 2am.
 *
 * The `server-only` import above is load-bearing: if any client component
 * ever transitively imports this module, the Next.js build fails with a
 * clear error instead of silently bundling secret-reading code (or
 * secrets themselves) into browser JavaScript.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url(),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url().optional(),

  // Base64-encoded 32-byte AES-256 key, e.g. `openssl rand -base64 32`.
  // Wraps a copy of every media file's key so the admin app can decrypt
  // content for moderation/support. This is what makes media NOT truly
  // zero-knowledge — see MediaItem.adminWrappedKey for details. Keep this
  // out of version control and rotate it via a re-wrap migration if it
  // ever leaks. Must match ADMIN_MASTER_KEY in the admin app's env.
  ADMIN_MASTER_KEY: z.string().min(1),

  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional().default("SecureVault <noreply@securevault.app>"),

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
