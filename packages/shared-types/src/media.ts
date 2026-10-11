import { z } from "zod";

export const mediaFileTypeSchema = z.enum([
  "image",
  "video",
  "document",
  "spreadsheet",
  "pdf",
  "other",
]);
export type MediaFileType = z.infer<typeof mediaFileTypeSchema>;

export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
] as const;

export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

/** Step 1: client asks for a presigned R2 upload URL before encrypting/uploading. */
export const requestUploadSchema = z.object({
  fileName: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(200),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
});
export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

export const requestUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  thumbnailUploadUrl: z.string().url().optional(),
  storageKey: z.string(),
  thumbnailKey: z.string().optional(),
});
export type RequestUploadResponse = z.infer<typeof requestUploadResponseSchema>;

const completeUploadBaseSchema = z.object({
  storageKey: z.string().min(1),
  thumbnailKey: z.string().optional(),
  fileName: z.string().min(1).max(500),
  originalName: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(200),
  fileSize: z.number().int().positive(),
  fileType: mediaFileTypeSchema,

  iv: z.string().min(1),
  chunkSize: z.number().int().positive(),
  chunkCount: z.number().int().positive(),
  thumbnailIv: z.string().optional(),

  // Sent once, over TLS, at upload time only — never stored raw. The
  // server immediately wraps this with the admin master key and discards
  // the raw value. This is what gives admin accounts visibility into
  // media content; see MediaItem.adminWrappedKey.
  adminRawFileKey: z.string().min(1),

  caption: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  isHidden: z.boolean().default(false),
  takenAt: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
});

/**
 * Two mutually exclusive shapes for how the file's encryption key is
 * wrapped: normally (with the master key, decrypts automatically once the
 * vault is unlocked) or per-file-password-protected (wrapped only with a
 * key derived from that file's own password — the master key cannot open
 * it). See MediaItem.requiresPassword in the Prisma schema for why these
 * are exclusive rather than both-populated.
 */
export const completeUploadSchema = z.discriminatedUnion("requiresPassword", [
  completeUploadBaseSchema.extend({
    requiresPassword: z.literal(false),
    encryptedFileKey: z.string().min(1),
    keyIv: z.string().min(1),
  }),
  completeUploadBaseSchema.extend({
    requiresPassword: z.literal(true),
    viewKeySalt: z.string().min(1),
    viewWrappedKey: z.string().min(1),
    viewKeyIv: z.string().min(1),
  }),
]);
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;

export const mediaListQuerySchema = z.object({
  fileType: mediaFileTypeSchema.optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;

export function inferFileType(mimeType: string): MediaFileType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("word") || mimeType.includes("document") || mimeType === "text/plain") {
    return "document";
  }
  return "other";
}
