import { z } from "zod";

export const passwordCategorySchema = z.enum(["social", "banking", "work", "other"]);
export type PasswordCategory = z.infer<typeof passwordCategorySchema>;

/**
 * The plaintext shape the client encrypts client-side before it ever
 * touches the network. The server never sees this schema's data directly —
 * only the API payload schema below, which wraps it as ciphertext.
 */
export const passwordVaultDataSchema = z.object({
  password: z.string().min(1).max(1024),
  notes: z.string().max(10_000).optional().default(""),
});
export type PasswordVaultData = z.infer<typeof passwordVaultDataSchema>;

/** What actually gets sent to POST /api/passwords — ciphertext + metadata only. */
export const createPasswordSchema = z.object({
  title: z.string().min(1).max(200),
  username: z.string().min(1).max(320),
  url: z.string().url().max(2048).optional().or(z.literal("")),
  category: passwordCategorySchema.default("other"),
  tags: z.array(z.string().max(50)).max(20).default([]),
  icon: z.string().max(500).optional(),
  isHidden: z.boolean().default(false),
  // Ciphertext produced by VaultEncryption.encryptJSON(passwordVaultDataSchema, itemKey)
  encryptedData: z.string().min(1),
  iv: z.string().min(1),
  // The item key itself, wrapped with the user's master key
  encryptedDataKey: z.string().min(1),
  keyIv: z.string().min(1),
});
export type CreatePasswordInput = z.infer<typeof createPasswordSchema>;

export const updatePasswordSchema = createPasswordSchema.partial().extend({
  id: z.string().cuid(),
});
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export const passwordListQuerySchema = z.object({
  category: passwordCategorySchema.optional(),
  search: z.string().max(200).optional(),
  tag: z.string().max(50).optional(),
  sort: z.enum(["recent", "alphabetical", "category"]).default("recent"),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type PasswordListQuery = z.infer<typeof passwordListQuerySchema>;

export const generatePasswordOptionsSchema = z.object({
  length: z.number().int().min(8).max(128).default(20),
  useSymbols: z.boolean().default(true),
  useNumbers: z.boolean().default(true),
  useUppercase: z.boolean().default(true),
  useLowercase: z.boolean().default(true),
});
export type GeneratePasswordOptions = z.infer<typeof generatePasswordOptionsSchema>;
