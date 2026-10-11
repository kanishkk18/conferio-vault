"use client";

import { Suspense, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { vaultPasswordSchema } from "@securevault/shared-types";
import { VaultEncryption } from "@securevault/encryption";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

// masterKeySalt is generated programmatically in onSubmit, not user input,
// so it's intentionally excluded from the form's own validation schema.
const registerFormSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    password: vaultPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type RegisterFormValues = z.infer<typeof registerFormSchema>;

function RegisterForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setSubmitting(true);
    try {
      // Generated client-side, before any network call. This salt is the
      // only thing the server ever stores related to key derivation — the
      // password itself is sent over HTTPS to Better Auth purely for
      // account authentication (hashed server-side there); it's never
      // transmitted anywhere for vault-key purposes.
      const masterKeySalt = VaultEncryption.generateSalt();

      const { error } = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        // @ts-expect-error -- additionalFields aren't in the base signUp type
        masterKeySalt,
      });

      if (error) {
        toast.error(error.message ?? "Registration failed");
        return;
      }

      toast.success("Check your email to verify your account before signing in.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Create your vault</h1>
        <p className="text-sm text-muted">
          Your vault password never leaves your device unencrypted — choose one you won&apos;t
          forget. There is no password recovery for encrypted items.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="password">
            Vault password
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="confirmPassword">
            Confirm password
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
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-muted text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
