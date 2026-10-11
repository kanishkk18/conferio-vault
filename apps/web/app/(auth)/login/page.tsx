"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@securevault/shared-types";
import { VaultEncryption } from "@securevault/encryption";
import { authClient } from "@/lib/auth-client";
import { useVaultKeyStore } from "@/store/vault-key-store";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const setMasterKey = useVaultKeyStore((s) => s.setMasterKey);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    try {
      const { data: signInData, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.status === 403) {
          toast.error("Please verify your email before signing in.");
        } else if (error.status === 429) {
          toast.error("Too many attempts. Please wait a few minutes and try again.");
        } else {
          toast.error(error.message ?? "Invalid email or password");
        }
        return;
      }

      // @ts-expect-error -- additionalFields aren't in the base session type
      const existingSalt: string | null | undefined = signInData?.user?.masterKeySalt;
      const justResetPassword = searchParams.get("resetSalt") === "1";

      let masterKeySalt = existingSalt;

      if (justResetPassword || !existingSalt) {
        // Either this account has no vault key yet, or the account
        // password was just reset (which invalidates the old master key
        // derivation) — either way, mint a fresh salt now that we have an
        // authenticated session.
        masterKeySalt = VaultEncryption.generateSalt();
        const saltResponse = await fetch("/api/user/master-key-salt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ masterKeySalt }),
        });
        if (!saltResponse.ok) {
          toast.error("Signed in, but couldn't finish vault setup. Please try again.");
          return;
        }
      }

      // Derive the master key from the just-entered password + the salt,
      // and keep it only in memory for this tab's session — never written
      // to sessionStorage/localStorage.
      const masterKey = await VaultEncryption.deriveMasterKey(data.password, masterKeySalt!);
      setMasterKey(masterKey);

      const redirectTo = searchParams.get("redirect") ?? "/vault/passwords";
      router.push(redirectTo);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/vault/passwords",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted">Sign in to unlock your vault.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 font-medium transition-colors"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full py-2.5 rounded-lg border border-border hover:bg-surface-hover transition-colors font-medium text-sm"
      >
        Continue with Google
      </button>

      <p className="text-sm text-muted text-center">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
