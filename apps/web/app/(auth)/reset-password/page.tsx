"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { vaultPasswordSchema } from "@securevault/shared-types";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

const resetFormSchema = z
  .object({
    newPassword: vaultPasswordSchema,
    confirmPassword: z.string(),
    acknowledgeDataLoss: z.boolean().refine((v) => v === true, {
      message: "You must acknowledge this before continuing",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ResetFormValues = z.infer<typeof resetFormSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({ resolver: zodResolver(resetFormSchema) });

  const onSubmit = async (data: ResetFormValues) => {
    if (!token) {
      toast.error("Missing or invalid reset link.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: data.newPassword,
        token,
      });

      if (resetError) {
        toast.error(resetError.message ?? "Could not reset password. The link may have expired.");
        return;
      }

      toast.success("Password reset. Sign in with your new password to finish setting up your vault.");
      // The new master-key salt is generated and stored once the user signs
      // in on the next screen — we don't have their email/session here to
      // do it directly, and generating a fresh salt requires an
      // authenticated request.
      router.push("/login?resetSalt=1");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
      </div>

      <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
        Resetting your password generates a brand-new encryption key. Any passwords or media
        encrypted under your old vault password will no longer be readable — there is no way for
        us to recover them.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="newPassword">
            New vault password
          </label>
          <input
            id="newPassword"
            type="password"
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-xs text-danger">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="confirmPassword">
            Confirm new password
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

        <label className="flex items-start gap-2 text-xs text-muted">
          <input type="checkbox" className="mt-0.5" {...register("acknowledgeDataLoss")} />
          <span>I understand this will make previously encrypted items unrecoverable.</span>
        </label>
        {errors.acknowledgeDataLoss && (
          <p className="text-xs text-danger">{errors.acknowledgeDataLoss.message}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 font-medium transition-colors"
        >
          {submitting ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </div>
  );
}
