import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@securevault/database";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit, jsonError, logAudit, requestMeta } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const rewrapSchema = z.discriminatedUnion("requiresPassword", [
  z.object({
    requiresPassword: z.literal(false),
    encryptedFileKey: z.string().min(1),
    keyIv: z.string().min(1),
  }),
  z.object({
    requiresPassword: z.literal(true),
    viewKeySalt: z.string().min(1),
    viewWrappedKey: z.string().min(1),
    viewKeyIv: z.string().min(1),
  }),
]);

export async function POST(request: NextRequest, { params }: RouteParams) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.mediaItem.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
  });
  if (!existing) return jsonError("Not found", 404);

  const parsed = rewrapSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }
  const data = parsed.data;

  const updated = await prisma.mediaItem.update({
    where: { id },
    data: data.requiresPassword
      ? {
          requiresPassword: true,
          viewKeySalt: data.viewKeySalt,
          viewWrappedKey: data.viewWrappedKey,
          viewKeyIv: data.viewKeyIv,
          encryptedFileKey: null,
          keyIv: null,
        }
      : {
          requiresPassword: false,
          encryptedFileKey: data.encryptedFileKey,
          keyIv: data.keyIv,
          viewKeySalt: null,
          viewWrappedKey: null,
          viewKeyIv: null,
        },
  });

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: data.requiresPassword ? "media_password_protect_enabled" : "media_password_protect_disabled",
    resource: "media",
    resourceId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json(updated);
}
