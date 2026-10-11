import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@securevault/database";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit, jsonError, logAudit, requestMeta } from "@/lib/api-utils";
import { getDownloadPresignedUrl } from "@/lib/r2";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getOwnedMedia(id: string, userId: string) {
  return prisma.mediaItem.findFirst({ where: { id, userId, deletedAt: null } });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;
  const item = await getOwnedMedia(id, session.user.id);
  if (!item) return jsonError("Not found", 404);

  const [downloadUrl, thumbnailUrl] = await Promise.all([
    getDownloadPresignedUrl(item.storageKey),
    item.thumbnailKey ? getDownloadPresignedUrl(item.thumbnailKey) : Promise.resolve(null),
  ]);

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "media_view",
    resource: "media",
    resourceId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ...item, downloadUrl, thumbnailUrl });
}

const patchSchema = z.object({
  caption: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isHidden: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;
  const existing = await getOwnedMedia(id, session.user.id);
  if (!existing) return jsonError("Not found", 404);

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const updated = await prisma.mediaItem.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;
  const existing = await getOwnedMedia(id, session.user.id);
  if (!existing) return jsonError("Not found", 404);

  // Soft delete — actual R2 object purge happens in a scheduled job after
  // the 30-day recovery window, not synchronously here.
  await prisma.mediaItem.update({ where: { id }, data: { deletedAt: new Date() } });

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "media_delete",
    resource: "media",
    resourceId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true });
}
