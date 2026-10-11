import { NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { apiRateLimiter, getClientIp } from "./rate-limit";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Generic per-IP API rate limit — call at the top of any route not covered by a more specific limiter. */
export async function enforceApiRateLimit(headers: Headers): Promise<NextResponse | null> {
  const ip = getClientIp(headers);
  const { success } = await apiRateLimiter.limit(`api:${ip}`);
  if (!success) {
    return jsonError("Too many requests. Please slow down.", 429);
  }
  return null;
}

interface AuditParams {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata as never,
      },
    });
  } catch (err) {
    // Audit logging must never break the primary request path.
    console.error("[audit] failed to write audit log:", err);
  }
}

export function requestMeta(request: Request) {
  return {
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}
