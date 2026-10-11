import { z } from "zod";

// Vault (master) password requirements are intentionally stricter than a
// typical account password since it's the only thing standing between an
// attacker and every secret this user has stored.
export const vaultPasswordSchema = z
  .string()
  .min(12, "Vault password must be at least 12 characters")
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[0-9]/, "Must include a number")
  .regex(/[^a-zA-Z0-9]/, "Must include a symbol");

export const registerSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    password: vaultPasswordSchema,
    confirmPassword: z.string(),
    // Generated client-side at registration time, before the password ever
    // leaves the browser — see VaultEncryption.generateSalt()
    masterKeySalt: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Resetting the account password is a special case for a zero-knowledge
 * vault: if the user forgets their vault password, the master key cannot
 * be re-derived and everything encrypted with it is unrecoverable by
 * design. A "reset" here creates a *new* master key/salt and the client
 * must re-encrypt (or the user must accept data loss on) existing items —
 * there is no server-side recovery path, and the UI must say so explicitly.
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: vaultPasswordSchema,
    confirmPassword: z.string(),
    newMasterKeySalt: z.string().min(1),
    acknowledgeDataLoss: z.literal(true),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const vaultUnlockSchema = z.object({
  vaultPassword: z.string().min(1),
});
export type VaultUnlockInput = z.infer<typeof vaultUnlockSchema>;
