import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { updatePasswordSchema } from "@securevault/shared-types";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit, jsonError, logAudit, requestMeta } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getOwnedPassword(id: string, userId: string) {
  const item = await prisma.password.findFirst({
    where: { id, userId, deletedAt: null },
  });
  return item;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;
  const item = await getOwnedPassword(id, session.user.id);
  if (!item) return jsonError("Not found", 404);

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "password_view",
    resource: "password",
    resourceId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;
  const existing = await getOwnedPassword(id, session.user.id);
  if (!existing) return jsonError("Not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = updatePasswordSchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }
  const data = parsed.data;

  const updated = await prisma.password.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.username !== undefined ? { username: data.username } : {}),
      ...(data.url !== undefined ? { url: data.url || null } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.icon !== undefined ? { icon: data.icon } : {}),
      ...(data.isHidden !== undefined ? { isHidden: data.isHidden } : {}),
      ...(data.encryptedData !== undefined ? { encryptedData: data.encryptedData } : {}),
      ...(data.iv !== undefined ? { iv: data.iv } : {}),
      ...(data.encryptedDataKey !== undefined
        ? { encryptedDataKey: data.encryptedDataKey }
        : {}),
      ...(data.keyIv !== undefined ? { keyIv: data.keyIv } : {}),
    },
  });

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "password_update",
    resource: "password",
    resourceId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;
  const existing = await getOwnedPassword(id, session.user.id);
  if (!existing) return jsonError("Not found", 404);

  // Soft delete — matches the media vault's 30-day recovery window pattern.
  await prisma.password.update({ where: { id }, data: { deletedAt: new Date() } });

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "password_delete",
    resource: "password",
    resourceId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true });
}
