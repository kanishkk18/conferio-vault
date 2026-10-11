export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 text-center">
      <div className="space-y-3">
        <div className="text-3xl">📡</div>
        <h1 className="text-xl font-semibold">You&apos;re offline</h1>
        <p className="text-sm text-muted max-w-xs mx-auto">
          This page isn&apos;t available without a connection. Anything you&apos;ve already
          loaded — like your password and media lists — should still work.
        </p>
      </div>
    </main>
  );
}
