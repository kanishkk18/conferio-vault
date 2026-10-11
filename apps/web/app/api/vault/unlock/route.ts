import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth-utils";
import { vaultUnlockRateLimiter, getClientIp } from "@/lib/rate-limit";
import { logAudit, requestMeta } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuthApi();
  if (error) return error;

  const ip = getClientIp(request.headers);
  const { success, remaining } = await vaultUnlockRateLimiter.limit(
    `vault-unlock:${session.user.id}:${ip}`
  );

  if (!success) {
    return NextResponse.json(
      { error: "Too many vault unlock attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "vault_unlock_attempt",
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ allowed: true, remaining });
}
