import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit, jsonError, logAudit, requestMeta } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.shareLink.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return jsonError("Not found", 404);

  await prisma.shareLink.update({ where: { id }, data: { isActive: false } });

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "share_revoke",
    resource: existing.type,
    resourceId: existing.itemId,
    ipAddress,
    userAgent,
    metadata: { shareId: id },
  });

  return NextResponse.json({ success: true });
}
