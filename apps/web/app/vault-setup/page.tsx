"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { vaultPasswordSchema } from "@securevault/shared-types";
import { VaultEncryption } from "@securevault/encryption";
import { authClient } from "@/lib/auth-client";
import { useVaultKeyStore } from "@/store/vault-key-store";

const schema = z
  .object({
    vaultPassword: vaultPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.vaultPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function VaultSetupPage() {
  const router = useRouter();
  const { data: sessionData, isPending } = authClient.useSession();
  const setMasterKey = useVaultKeyStore((s) => s.setMasterKey);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (isPending) {
    return <main className="min-h-screen flex items-center justify-center text-muted">Loading…</main>;
  }

  if (!sessionData) {
    router.push("/login");
    return null;
  }

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const masterKeySalt = VaultEncryption.generateSalt();
      const res = await fetch("/api/user/master-key-salt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterKeySalt }),
      });
      if (!res.ok) {
        toast.error("Couldn't save your vault setup. Please try again.");
        return;
      }

      const masterKey = await VaultEncryption.deriveMasterKey(data.vaultPassword, masterKeySalt);
      setMasterKey(masterKey);

      toast.success("Vault ready.");
      router.push("/vault/passwords");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Set your vault password</h1>
          <p className="text-sm text-muted">
            This is separate from your {sessionData.user.email} sign-in — it&apos;s the only key
            that can decrypt what you store here, and we never see it. There is no recovery if you
            forget it.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="vaultPassword">
              Vault password
            </label>
            <input
              id="vaultPassword"
              type="password"
              className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              {...register("vaultPassword")}
            />
            {errors.vaultPassword && (
              <p className="text-xs text-danger">{errors.vaultPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="confirmPassword">
              Confirm
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 font-medium transition-colors"
          >
            {submitting ? "Setting up…" : "Create vault"}
          </button>
        </form>
      </div>
    </main>
  );
}
