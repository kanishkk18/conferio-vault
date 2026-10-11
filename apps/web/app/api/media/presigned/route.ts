import { NextRequest, NextResponse } from "next/server";
import { requestUploadSchema, MAX_FILE_SIZE_BYTES } from "@securevault/shared-types";
import { requireAuthApi } from "@/lib/auth-utils";
import { enforceApiRateLimit, jsonError } from "@/lib/api-utils";
import { generateStorageKey, getUploadPresignedUrl } from "@/lib/r2";

export async function POST(request: NextRequest) {
  const rateLimited = await enforceApiRateLimit(request.headers);
  if (rateLimited) return rateLimited;

  const { error } = await requireAuthApi();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = requestUploadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  if (parsed.data.fileSize > MAX_FILE_SIZE_BYTES) {
    return jsonError(`File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`, 413);
  }

  const storageKey = generateStorageKey();
  const uploadUrl = await getUploadPresignedUrl(storageKey);

  const isImageOrVideo =
    parsed.data.mimeType.startsWith("image/") || parsed.data.mimeType.startsWith("video/");
  let thumbnailKey: string | undefined;
  let thumbnailUploadUrl: string | undefined;
  if (isImageOrVideo) {
    thumbnailKey = generateStorageKey();
    thumbnailUploadUrl = await getUploadPresignedUrl(thumbnailKey);
  }

  return NextResponse.json({
    uploadUrl,
    storageKey,
    ...(thumbnailKey ? { thumbnailKey, thumbnailUploadUrl } : {}),
  });
}
