import { z } from "zod";

export const shareTypeSchema = z.enum(["password", "media"]);
export type ShareType = z.infer<typeof shareTypeSchema>;
export const shareExpirySchema = z.enum(["1h", "1d", "7d", "never"]);

export const createShareSchema = z
  .object({
    type: shareTypeSchema,
    itemId: z.string().cuid(),
    expiry: shareExpirySchema.default("7d"),
    maxUses: z.number().int().positive().max(1000).optional(),
    recipientEmail: z.string().email().optional(),
    recipientUserId: z.string().cuid().optional(),
    // If set, the item's key is re-wrapped with a key derived from this
    // password so link recipients need it to decrypt. Never sent in plaintext
    // — the API only ever receives the already-wrapped key + salt.
    wrappedKeyForShare: z.string().optional(),
    shareKeyIv: z.string().optional(),
    shareKeySalt: z.string().optional(),
  })
  .refine((data) => !data.recipientEmail || !data.recipientUserId, {
    message: "Provide either recipientEmail or recipientUserId, not both",
  });
export type CreateShareInput = z.infer<typeof createShareSchema>;

export const accessShareSchema = z.object({
  token: z.string().min(1),
  sharePassword: z.string().optional(),
});
export type AccessShareInput = z.infer<typeof accessShareSchema>;

export function expiryToDate(expiry: z.infer<typeof shareExpirySchema>): Date | null {
  const now = Date.now();
  switch (expiry) {
    case "1h":
      return new Date(now + 60 * 60 * 1000);
    case "1d":
      return new Date(now + 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    case "never":
      return null;
  }
}
