import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { requireAdminApi } from "@/lib/auth-utils";
import { decryptMediaForAdmin } from "@/lib/admin-decrypt";
import { adminApiRateLimiter, getClientIp } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const ip = getClientIp(request.headers);
  const { success } = await adminApiRateLimiter.limit(`admin-api:${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id } = await params;
  const item = await prisma.mediaItem.findFirst({
    where: { id, deletedAt: null },
    select: {
      storageKey: true,
      thumbnailKey: true,
      adminWrappedKey: true,
      adminKeyIv: true,
      iv: true,
      thumbnailIv: true,
      chunkSize: true,
      chunkCount: true,
      mimeType: true,
      originalName: true,
      userId: true,
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const blob = await decryptMediaForAdmin(item);
    const buffer = Buffer.from(await blob.arrayBuffer());

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "admin_media_view",
        resource: "media",
        resourceId: id,
        metadata: { viewedUserId: item.userId },
      },
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": item.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(item.originalName)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to decrypt file" },
      { status: 500 }
    );
  }
}
