import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { requireAdminApi } from "@/lib/auth-utils";
import { decryptThumbnailForAdmin } from "@/lib/admin-decrypt";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdminApi();
  if (error) return error;

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
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const blob = await decryptThumbnailForAdmin(item);
    if (!blob) return NextResponse.json({ error: "No thumbnail" }, { status: 404 });

    const buffer = Buffer.from(await blob.arrayBuffer());
    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to decrypt thumbnail" },
      { status: 500 }
    );
  }
}
