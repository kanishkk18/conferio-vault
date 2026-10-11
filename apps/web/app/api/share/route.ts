import { NextRequest, NextResponse } from "next/server";
import { randomBytes as nodeRandomBytes } from "crypto";
import { prisma } from "@securevault/database";
import { createShareSchema, expiryToDate } from "@securevault/shared-types";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit, jsonError, logAudit, requestMeta } from "@/lib/api-utils";

function generateToken(): string {
  return nodeRandomBytes(24).toString("base64url");
}

export async function POST(request: NextRequest) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const parsed = createShareSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }
  const data = parsed.data;

  // Verify the sender actually owns the item being shared.
  const owns =
    data.type === "password"
      ? await prisma.password.findFirst({
          where: { id: data.itemId, userId: session.user.id, deletedAt: null },
          select: { id: true },
        })
      : await prisma.mediaItem.findFirst({
          where: { id: data.itemId, userId: session.user.id, deletedAt: null },
          select: { id: true },
        });
  if (!owns) return jsonError("Item not found", 404);

  if (data.recipientUserId) {
    const recipient = await prisma.user.findUnique({
      where: { id: data.recipientUserId },
      select: { publicKey: true },
    });
    if (!recipient?.publicKey) {
      return jsonError("Recipient hasn't set up their vault yet", 400);
    }
  }

  const created = await prisma.shareLink.create({
    data: {
      userId: session.user.id,
      type: data.type,
      itemId: data.itemId,
      token: generateToken(),
      expiresAt: expiryToDate(data.expiry),
      maxUses: data.maxUses,
      recipientEmail: data.recipientEmail,
      recipientUserId: data.recipientUserId,
      wrappedKeyForShare: data.wrappedKeyForShare,
      shareKeyIv: data.shareKeyIv,
      shareKeySalt: data.shareKeySalt,
    },
  });

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "share_create",
    resource: data.type,
    resourceId: data.itemId,
    ipAddress,
    userAgent,
    metadata: { shareId: created.id, hasRecipient: Boolean(data.recipientUserId) },
  });

  return NextResponse.json(created, { status: 201 });
}
