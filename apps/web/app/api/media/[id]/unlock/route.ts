import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { requireAuthApi } from "@/lib/auth-utils";
import { mediaUnlockRateLimiter, getClientIp } from "@/lib/rate-limit";
import { jsonError, logAudit, requestMeta } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;
  const item = await prisma.mediaItem.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
  });
  if (!item) return jsonError("Not found", 404);
  if (!item.requiresPassword) return jsonError("This file isn't password-protected", 400);

  const ip = getClientIp(request.headers);
  const { success, remaining } = await mediaUnlockRateLimiter.limit(
    `media-unlock:${session.user.id}:${id}:${ip}`
  );

  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts for this file. Please wait a few minutes." },
      { status: 429 }
    );
  }

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "media_password_unlock_attempt",
    resource: "media",
    resourceId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    allowed: true,
    remaining,
    viewKeySalt: item.viewKeySalt,
    viewWrappedKey: item.viewWrappedKey,
    viewKeyIv: item.viewKeyIv,
  });
}
