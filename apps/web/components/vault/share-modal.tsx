"use client";

import { useState } from "react";
import { X, Copy, Link2, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import type { ShareType } from "@securevault/shared-types";
import { useCreateLinkShare, useCreateUserShare, searchUserByEmail } from "@/hooks/use-share";
import { useVaultKeyStore } from "@/store/vault-key-store";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  type: ShareType;
  itemId: string;
  itemKey: CryptoKey | null;
  itemLabel: string;
}

type Tab = "link" | "person";

export function ShareModal({ open, onClose, type, itemId, itemKey, itemLabel }: ShareModalProps) {
  const masterKey = useVaultKeyStore((s) => s.masterKey);
  const [tab, setTab] = useState<Tab>("link");

  // Link tab state
  const [expiry, setExpiry] = useState<"1h" | "1d" | "7d" | "never">("7d");
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [sharePassword, setSharePassword] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createLinkShare = useCreateLinkShare();

  // Person tab state
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{ id: string; name: string; publicKey: string } | null>(
    null
  );
  const createUserShare = useCreateUserShare();

  if (!open) return null;

  const handleClose = () => {
    setResultUrl(null);
    setFoundUser(null);
    setEmail("");
    onClose();
  };

  const handleCreateLink = async () => {
    if (!itemKey) return toast.error("Item isn't ready to share yet.");
    if (passwordProtect && sharePassword.length < 4) {
      return toast.error("Share password must be at least 4 characters.");
    }
    try {
      const { url } = await createLinkShare.mutateAsync({
        type,
        itemId,
        itemKey,
        expiry,
        sharePassword: passwordProtect ? sharePassword : undefined,
      });
      setResultUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create link");
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    setFoundUser(null);
    try {
      const result = await searchUserByEmail(email);
      if (!result.found) {
        toast.error("No SecureVault user found with that email (or they haven't set up their vault yet).");
        return;
      }
      setFoundUser(result);
    } catch {
      toast.error("Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const handleShareWithUser = async () => {
    if (!itemKey || !masterKey || !foundUser) return;
    try {
      await createUserShare.mutateAsync({
        type,
        itemId,
        itemKey,
        masterKey,
        recipientUserId: foundUser.id,
        recipientPublicKey: foundUser.publicKey,
      });
      toast.success(`Shared with ${foundUser.name || "user"}`);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to share");
    }
  };

  const handleCopy = () => {
    if (!resultUrl) return;
    navigator.clipboard.writeText(resultUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(`Check this out: ${resultUrl ?? ""}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold truncate">Share &quot;{itemLabel}&quot;</h2>
          <button onClick={handleClose} className="text-muted hover:text-foreground shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("link")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm ${
              tab === "link" ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface-hover"
            }`}
          >
            <Link2 size={14} /> Link
          </button>
          <button
            onClick={() => setTab("person")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm ${
              tab === "person" ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface-hover"
            }`}
          >
            <UserPlus size={14} /> Person
          </button>
        </div>

        {tab === "link" ? (
          resultUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2">
                <span className="text-xs truncate flex-1">{resultUrl}</span>
                <button onClick={handleCopy} className="text-muted hover:text-accent shrink-0">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 rounded-lg border border-border hover:bg-surface-hover text-sm"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(resultUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 rounded-lg border border-border hover:bg-surface-hover text-sm"
                >
                  Telegram
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted">Expires</label>
                <select
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value as typeof expiry)}
                  className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="1h">1 hour</option>
                  <option value="1d">1 day</option>
                  <option value="7d">7 days</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={passwordProtect}
                  onChange={(e) => setPasswordProtect(e.target.checked)}
                />
                Protect with a password
              </label>
              {passwordProtect && (
                <input
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="Link password"
                  className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
              )}

              <button
                onClick={handleCreateLink}
                disabled={createLinkShare.isPending}
                className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 font-medium text-sm"
              >
                {createLinkShare.isPending ? "Creating…" : "Create link"}
              </button>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Recipient's email"
                className="flex-1 rounded-lg bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !email}
                className="px-3 rounded-lg border border-border hover:bg-surface-hover disabled:opacity-50 text-sm"
              >
                {searching ? "…" : "Find"}
              </button>
            </div>

            {foundUser && (
              <div className="rounded-lg bg-background border border-border p-3 flex items-center justify-between">
                <span className="text-sm">{foundUser.name || email}</span>
                <button
                  onClick={handleShareWithUser}
                  disabled={createUserShare.isPending}
                  className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-xs font-medium"
                >
                  {createUserShare.isPending ? "Sharing…" : "Share"}
                </button>
              </div>
            )}

            <p className="text-xs text-muted">
              Only works for people who already have a SecureVault account with their vault set up
              — sharing is end-to-end encrypted between you and them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
