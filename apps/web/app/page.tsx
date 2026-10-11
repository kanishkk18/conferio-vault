import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">🔒 SecureVault</h1>
        <p className="text-muted max-w-md mx-auto">
          Passwords and media, encrypted in your browser before they ever leave your device.
          We can&apos;t read your data — only you can.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover transition-colors font-medium"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-lg border border-border hover:bg-surface-hover transition-colors font-medium"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
