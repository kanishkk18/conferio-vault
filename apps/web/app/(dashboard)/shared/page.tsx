"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { useSharedWithMe } from "@/hooks/use-share";
import { useVaultKeyStore } from "@/store/vault-key-store";
import { ensureKeypair } from "@/lib/keypair";
import {
  decryptSharedPassword,
  decryptSharedMediaFile,
  type SharedWithMeItem,
} from "@/hooks/use-shared-item-decrypt";

function SharedPasswordCard({ item, ownPrivateKey }: { item: SharedWithMeItem; ownPrivateKey: CryptoKey }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleReveal = async () => {
    if (revealed) return setRevealed(null);
    setBusy(true);
    try {
      const data = await decryptSharedPassword(item, ownPrivateKey);
      setRevealed(data.password);
    } catch {
      toast.error("Couldn't decrypt this shared password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{item.password?.title}</h3>
        <span className="text-[10px] text-muted">from {item.sender.name || item.sender.email}</span>
      </div>
      <div className="text-sm text-muted">{item.password?.username}</div>
      <div className="flex items-center justify-between text-sm font-mono">
        <span>{busy ? "Decrypting…" : revealed ?? "••••••••••••"}</span>
        <div className="flex items-center gap-2">
          <button onClick={handleReveal} className="text-muted hover:text-accent">
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {revealed && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(revealed);
                toast.success("Copied");
              }}
              className="text-muted hover:text-accent"
            >
              <Copy size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SharedMediaCard({ item, ownPrivateKey }: { item: SharedWithMeItem; ownPrivateKey: CryptoKey }) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const blob = await decryptSharedMediaFile(item, ownPrivateKey);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.media?.originalName ?? "download";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't decrypt this shared file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
      <div className="min-w-0">
        <h3 className="font-medium truncate">{item.media?.originalName}</h3>
        <span className="text-[10px] text-muted">from {item.sender.name || item.sender.email}</span>
      </div>
      <button
        onClick={handleDownload}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover text-xs shrink-0"
      >
        <Download size={13} /> {busy ? "…" : "Download"}
      </button>
    </div>
  );
}

export default function SharedWithMePage() {
  const masterKey = useVaultKeyStore((s) => s.masterKey);
  const { data: items, isLoading } = useSharedWithMe();
  const [ownPrivateKey, setOwnPrivateKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    if (!masterKey) return;
    ensureKeypair(masterKey)
      .then(({ privateKey }) => setOwnPrivateKey(privateKey))
      .catch(() => toast.error("Couldn't set up your sharing keys."));
  }, [masterKey]);

  return (
    <div className="flex-1 p-6 space-y-5 overflow-y-auto">
      <h1 className="text-xl font-semibold">Shared with me</h1>

      {isLoading || !ownPrivateKey ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-lg mb-1">Nothing shared with you yet</p>
          <p className="text-sm">Items other SecureVault users share with you will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(items as SharedWithMeItem[]).map((item) =>
            item.type === "password" ? (
              <SharedPasswordCard key={item.shareId} item={item} ownPrivateKey={ownPrivateKey} />
            ) : (
              <SharedMediaCard key={item.shareId} item={item} ownPrivateKey={ownPrivateKey} />
            )
          )}
        </div>
      )}
    </div>
  );
}
