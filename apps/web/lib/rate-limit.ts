import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { serverEnv } from "./env.server";

const redis = new Redis({
  url: serverEnv.UPSTASH_REDIS_REST_URL,
  token: serverEnv.UPSTASH_REDIS_REST_TOKEN,
});

/** 5 login attempts per IP per 15 minutes, per the security spec. */
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "ratelimit:login",
  analytics: true,
});

/** Slightly more generous limit for registration to allow for typos/retries. */
export const registerRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "ratelimit:register",
  analytics: true,
});

/** Vault-password unlock attempts (unhiding a password/media item). */
export const vaultUnlockRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:vault-unlock",
  analytics: true,
});

/**
 * Per-file password attempts. Stricter than the vault-unlock limiter
 * because a per-file password may be a short PIN (e.g. "1234") with far
 * less entropy than a real vault password, so it needs a tighter budget
 * to resist brute-forcing.
 */
export const mediaUnlockRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "5 m"),
  prefix: "ratelimit:media-unlock",
  analytics: true,
});

/** Generic API rate limit, for anything not covered by a more specific limiter above. */
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "ratelimit:api",
  analytics: true,
});

/** Public (unauthenticated) share-link access — keyed by IP only, since there's no session. */
export const shareAccessRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "ratelimit:share-access",
  analytics: true,
});

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}

export { redis };
