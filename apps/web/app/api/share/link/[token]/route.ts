import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { jsonError, logAudit, requestMeta } from "@/lib/api-utils";
import { shareAccessRateLimiter, getClientIp } from "@/lib/rate-limit";
import { getDownloadPresignedUrl } from "@/lib/r2";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const ip = getClientIp(request.headers);
  const { success } = await shareAccessRateLimiter.limit(`share-access:${ip}`);
  if (!success) return jsonError("Too many requests. Please try again shortly.", 429);

  const { token } = await params;
  const share = await prisma.shareLink.findUnique({ where: { token } });

  if (!share || !share.isActive) return jsonError("This link is invalid or has been revoked", 404);
  if (share.expiresAt && share.expiresAt < new Date()) {
    return jsonError("This link has expired", 410);
  }
  if (share.maxUses !== null && share.usedCount >= share.maxUses) {
    return jsonError("This link has reached its maximum number of uses", 410);
  }

  const { ipAddress, userAgent } = requestMeta(request);

  if (share.type === "password") {
    const item = await prisma.password.findFirst({
      where: { id: share.itemId, deletedAt: null },
      select: { title: true, username: true, url: true, encryptedData: true, iv: true },
    });
    if (!item) return jsonError("The shared item no longer exists", 404);

    await prisma.shareLink.update({ where: { id: share.id }, data: { usedCount: { increment: 1 } } });
    await logAudit({
      userId: share.userId,
      action: "share_access",
      resource: "password",
      resourceId: share.itemId,
      ipAddress,
      userAgent,
      metadata: { shareId: share.id },
    });

    return NextResponse.json({
      type: "password",
      requiresPassword: Boolean(share.shareKeySalt),
      wrappedKeyForShare: share.wrappedKeyForShare,
      shareKeyIv: share.shareKeyIv,
      shareKeySalt: share.shareKeySalt,
      password: item,
    });
  }

  const item = await prisma.mediaItem.findFirst({
    where: { id: share.itemId, deletedAt: null },
    select: {
      originalName: true,
      mimeType: true,
      fileSize: true,
      fileType: true,
      storageKey: true,
      thumbnailKey: true,
      iv: true,
      thumbnailIv: true,
      chunkSize: true,
      chunkCount: true,
    },
  });
  if (!item) return jsonError("The shared item no longer exists", 404);

  const [downloadUrl, thumbnailUrl] = await Promise.all([
    getDownloadPresignedUrl(item.storageKey),
    item.thumbnailKey ? getDownloadPresignedUrl(item.thumbnailKey) : Promise.resolve(null),
  ]);

  await prisma.shareLink.update({ where: { id: share.id }, data: { usedCount: { increment: 1 } } });
  await logAudit({
    userId: share.userId,
    action: "share_access",
    resource: "media",
    resourceId: share.itemId,
    ipAddress,
    userAgent,
    metadata: { shareId: share.id },
  });

  return NextResponse.json({
    type: "media",
    requiresPassword: Boolean(share.shareKeySalt),
    wrappedKeyForShare: share.wrappedKeyForShare,
    shareKeyIv: share.shareKeyIv,
    shareKeySalt: share.shareKeySalt,
    media: { ...item, downloadUrl, thumbnailUrl },
  });
}
