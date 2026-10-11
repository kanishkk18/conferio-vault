import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit } from "@/lib/api-utils";
import { getDownloadPresignedUrl } from "@/lib/r2";

export async function GET(request: NextRequest) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const shares = await prisma.shareLink.findMany({
    where: {
      recipientUserId: session.user.id,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, publicKey: true } },
    },
  });

  interface ShareWithSender {
    id: string;
    type: string;
    itemId: string;
    wrappedKeyForShare: string | null;
    shareKeyIv: string | null;
    user: { id: string; name: string | null; email: string; publicKey: string | null };
  }

  const results = await Promise.all(
    (shares as ShareWithSender[]).map(async (share) => {
      if (share.type === "password") {
        const item = await prisma.password.findFirst({
          where: { id: share.itemId, deletedAt: null },
          select: { title: true, username: true, url: true, encryptedData: true, iv: true },
        });
        if (!item) return null;
        return {
          shareId: share.id,
          type: share.type,
          sender: share.user,
          wrappedKeyForShare: share.wrappedKeyForShare,
          shareKeyIv: share.shareKeyIv,
          password: item,
        };
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
      if (!item) return null;

      const [downloadUrl, thumbnailUrl] = await Promise.all([
        getDownloadPresignedUrl(item.storageKey),
        item.thumbnailKey ? getDownloadPresignedUrl(item.thumbnailKey) : Promise.resolve(null),
      ]);

      return {
        shareId: share.id,
        type: share.type,
        sender: share.user,
        wrappedKeyForShare: share.wrappedKeyForShare,
        shareKeyIv: share.shareKeyIv,
        media: { ...item, downloadUrl, thumbnailUrl },
      };
    })
  );

  return NextResponse.json({ items: results.filter(Boolean) });
}
