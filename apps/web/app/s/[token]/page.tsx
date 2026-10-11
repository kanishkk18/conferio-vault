"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Copy, Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { unwrapLinkShareKeyless, unwrapLinkSharePassword } from "@/lib/share-crypto";
import { VaultEncryption } from "@securevault/encryption";
import type { PasswordVaultData } from "@securevault/shared-types";

interface ShareData {
  type: "password" | "media";
  requiresPassword: boolean;
  wrappedKeyForShare: string;
  shareKeyIv: string;
  shareKeySalt: string | null;
  password?: { title: string; username: string; url: string | null; encryptedData: string; iv: string };
  media?: {
    originalName: string;
    mimeType: string;
    fileSize: number;
    iv: string;
    chunkSize: number;
    chunkCount: number;
    downloadUrl: string;
  };
}

export default function PublicSharePage() {
  const params = useParams<{ token: string }>();
  const [fragmentKey, setFragmentKey] = useState<string | null>(null);
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharePassword, setSharePassword] = useState("");
  const [itemKey, setItemKey] = useState<CryptoKey | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState<PasswordVaultData | null>(null);

  useEffect(() => {
    // Fragments never reach the server — read it here, client-side only.
    const hash = window.location.hash;
    const match = hash.match(/key=([^&]+)/);
    if (match) setFragmentKey(decodeURIComponent(match[1]!));

    fetch(`/api/share/link/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "This link is invalid.");
        }
        return res.json();
      })
      .then((shareData: ShareData) => setData(shareData))
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));
  }, [params.token]);

  // Auto-unlock password-less links as soon as we have both the share data and the fragment key.
  useEffect(() => {
    if (!data || data.requiresPassword || itemKey || !fragmentKey) return;
    unwrapLinkShareKeyless(data.wrappedKeyForShare, data.shareKeyIv, fragmentKey)
      .then(setItemKey)
      .catch(() => setError("This link's decryption key is missing or invalid."));
  }, [data, fragmentKey, itemKey]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setUnlocking(true);
    try {
      const key = await unwrapLinkSharePassword(
        data.wrappedKeyForShare,
        data.shareKeyIv,
        data.shareKeySalt!,
        sharePassword
      );
      setItemKey(key);
    } catch {
      toast.error("Incorrect password.");
    } finally {
      setUnlocking(false);
    }
  };

  useEffect(() => {
    if (!itemKey || !data?.password || revealedPassword) return;
    VaultEncryption.decryptJSON<PasswordVaultData>(
      { ciphertext: data.password.encryptedData, iv: data.password.iv },
      itemKey
    )
      .then(setRevealedPassword)
      .catch(() => setError("Failed to decrypt — the link may be corrupted."));
  }, [itemKey, data, revealedPassword]);

  const handleDownloadMedia = async () => {
    if (!itemKey || !data?.media) return;
    try {
      const res = await fetch(data.media.downloadUrl);
      const encryptedBlob = await res.blob();
      const blob = await VaultEncryption.decryptFile(
        encryptedBlob,
        itemKey,
        data.media.iv,
        data.media.chunkSize,
        data.media.chunkCount,
        data.media.mimeType
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.media.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to decrypt the file.");
    }
  };

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-muted">Loading…</main>;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-lg mb-1">🔒 Can&apos;t open this link</p>
          <p className="text-sm text-muted">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  if (data.requiresPassword && !itemKey) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={handlePasswordSubmit} className="w-full max-w-xs space-y-4 text-center">
          <Lock size={24} className="mx-auto text-muted" />
          <h1 className="text-lg font-semibold">Password required</h1>
          <input
            type="password"
            autoFocus
            value={sharePassword}
            onChange={(e) => setSharePassword(e.target.value)}
            placeholder="Share password"
            className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-center outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={unlocking || !sharePassword}
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 font-medium text-sm"
          >
            {unlocking ? "Unlocking…" : "Unlock"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center text-2xl">🔒</div>

        {data.type === "password" && data.password && (
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h1 className="text-lg font-semibold">{data.password.title}</h1>
            <div className="text-sm text-muted">{data.password.username}</div>
            <div className="flex items-center justify-between text-sm font-mono bg-background rounded-lg px-3 py-2">
              <span>{revealedPassword ? revealedPassword.password : "Decrypting…"}</span>
              {revealedPassword && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(revealedPassword.password);
                    toast.success("Copied");
                  }}
                  className="text-muted hover:text-accent"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
            {revealedPassword?.notes && (
              <p className="text-xs text-muted whitespace-pre-wrap">{revealedPassword.notes}</p>
            )}
          </div>
        )}

        {data.type === "media" && data.media && (
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3 text-center">
            <h1 className="text-lg font-semibold truncate">{data.media.originalName}</h1>
            <p className="text-xs text-muted">{(data.media.fileSize / 1024 / 1024).toFixed(2)} MB</p>
            <button
              onClick={handleDownloadMedia}
              disabled={!itemKey}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 font-medium text-sm"
            >
              <Download size={16} /> Decrypt & download
            </button>
          </div>
        )}

        <p className="text-xs text-muted text-center">
          Shared via SecureVault — this content is decrypted entirely in your browser.
        </p>
      </div>
    </main>
  );
}
