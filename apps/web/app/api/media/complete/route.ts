import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@securevault/database";
import { completeUploadSchema, inferFileType } from "@securevault/shared-types";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit, jsonError, logAudit, requestMeta } from "@/lib/api-utils";
import { wrapForAdminEscrow } from "@/lib/admin-escrow";

export async function POST(request: NextRequest) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { session, error } = await requireAuthApi();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = completeUploadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }
  const data = parsed.data;

  // Wrap once here, immediately — `data.adminRawFileKey` must not be
  // referenced again after this line, and must never be passed to
  // logAudit's metadata or any other logging call below.
  const { adminWrappedKey, adminKeyIv } = await wrapForAdminEscrow(data.adminRawFileKey);

  const takenAt = data.takenAt ? new Date(data.takenAt) : new Date();

  const created = await prisma.mediaItem.create({
    data: {
      userId: session.user.id,
      fileName: data.fileName,
      originalName: data.originalName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      fileType: data.fileType ?? inferFileType(data.mimeType),

      storageKey: data.storageKey,
      thumbnailKey: data.thumbnailKey,
      iv: data.iv,
      chunkSize: data.chunkSize,
      chunkCount: data.chunkCount,
      thumbnailIv: data.thumbnailIv,

      adminWrappedKey,
      adminKeyIv,

      requiresPassword: data.requiresPassword,
      ...(data.requiresPassword
        ? {
            viewKeySalt: data.viewKeySalt,
            viewWrappedKey: data.viewWrappedKey,
            viewKeyIv: data.viewKeyIv,
          }
        : {
            encryptedFileKey: data.encryptedFileKey,
            keyIv: data.keyIv,
          }),

      caption: data.caption,
      tags: data.tags,
      isHidden: data.isHidden,
      takenAt,
      year: takenAt.getFullYear(),
      month: takenAt.getMonth() + 1,
      location: data.location,
    },
  });

  const { ipAddress, userAgent } = requestMeta(request);
  await logAudit({
    userId: session.user.id,
    action: "media_upload",
    resource: "media",
    resourceId: created.id,
    ipAddress,
    userAgent,
    metadata: { fileType: created.fileType, fileSize: created.fileSize },
  });

  return NextResponse.json(created, { status: 201 });
}
