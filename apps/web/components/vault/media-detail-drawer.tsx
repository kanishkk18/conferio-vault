// components/vault/media-detail-drawer.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Lock,
  Download,
  Share2,
  Trash2,
  FileText,
  Film,
  FileSpreadsheet,
  File,
  Calendar,
  HardDrive,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import type { MediaListItem } from "@/hooks/use-media";
import {
  getFileKeyForNormalItem,
  getFileKeyForProtectedItem,
  decryptThumbnail,
  decryptFullFile,
  MediaUnlockError,
} from "@/hooks/use-media-decrypt";
import { useVaultKeyStore } from "@/store/vault-key-store";
import { ShareModal } from "./share-modal";
import {
  FamilyDrawerAnimatedContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerContent,
  FamilyDrawerRoot,
  FamilyDrawerClose,
  FamilyDrawerPortal,
  FamilyDrawerOverlay,
} from "@/lib/drawer";

const FILE_ICONS: Record<string, typeof FileText> = {
  document: FileText,
  video: Film,
  spreadsheet: FileSpreadsheet,
  pdf: FileText,
  other: File,
};

function formatBytes(b: number) {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024).toFixed(0)} KB`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function MediaDetailDrawer({
  item,
  open,
  onClose,
  onDelete,
}: {
  item: MediaListItem | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const masterKey = useVaultKeyStore((s) => s.masterKey);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState<CryptoKey | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  /* Reset + auto-decrypt when item changes */
  useEffect(() => {
    if (!open || !item) return;
    setThumbnailUrl(null);
    setFileKey(null);
    setUnlocked(!item.requiresPassword);
    setPassword("");

    let url: string | null = null;
    (async () => {
      if (item.requiresPassword || !masterKey || !item.thumbnailKey) return;
      try {
        const key = await getFileKeyForNormalItem(item, masterKey);
        setFileKey(key);
        url = await decryptThumbnail(item, key);
        setThumbnailUrl(url);
      } catch {}
    })();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, item, masterKey]);

  if (!item) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const key = await getFileKeyForProtectedItem(item.id, password);
      setFileKey(key);
      setUnlocked(true);
      setPassword("");
      const url = await decryptThumbnail(item, key);
      setThumbnailUrl(url);
    } catch (err) {
      toast.error(
        err instanceof MediaUnlockError ? err.message : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  };

  const handleOpenOrDownload = async () => {
    if (!fileKey) {
      toast.error("Vault is locked.");
      return;
    }
    setBusy(true);
    try {
      const blob = await decryptFullFile(item, fileKey);
      if (
        item.mimeType.startsWith("image/") ||
        item.mimeType === "application/pdf"
      ) {
        window.open(
          URL.createObjectURL(blob),
          "_blank",
          "noopener,noreferrer",
        );
      } else {
        triggerDownload(blob, item.originalName);
      }
    } catch {
      toast.error("Failed to decrypt file.");
    } finally {
      setBusy(false);
    }
  };

  const Icon = FILE_ICONS[item.fileType] ?? File;

  return (
    <FamilyDrawerRoot open={open} onOpenChange={(v) => !v && onClose()}>
      <FamilyDrawerPortal>
        <FamilyDrawerOverlay onClick={onClose} />
        <FamilyDrawerContent className="bg-[#111111] h-[30%]">
          <FamilyDrawerClose />
          <FamilyDrawerAnimatedWrapper>
            <FamilyDrawerAnimatedContent>
              {/* ── Preview ── */}
              <button
                onClick={unlocked ? handleOpenOrDownload : undefined}
                className="relative mx-auto flex h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08]"
              >
                {thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnailUrl}
                    alt={item.originalName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Icon size={36} className="text-neutral-500" />
                )}
                {item.requiresPassword && !unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Lock size={20} className="text-white/60" />
                  </div>
                )}
              </button>

              {/* ── Password prompt ── */}
              {item.requiresPassword && !unlocked && (
                <form
                  onSubmit={handleUnlock}
                  className="mt-4 space-y-3"
                  data-vaul-no-drag
                >
                  <p className="text-center text-[13px] text-neutral-500">
                    This file is password-protected
                  </p>
                  <input
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="File password"
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[13.5px] text-white outline-none placeholder:text-neutral-600 transition-all focus:border-white/20 focus:bg-white/[0.06]"
                  />
                  <button
                    type="submit"
                    disabled={busy || !password}
                    className="h-[44px] w-full rounded-2xl bg-white text-[13px] font-semibold text-black disabled:opacity-30 transition-all active:scale-[0.97]"
                  >
                    {busy ? "Unlocking…" : "Unlock"}
                  </button>
                </form>
              )}

              {/* ── Metadata ── */}
              <div className="mt-5 space-y-3">
                <h3 className="truncate text-[15px] font-semibold text-white">
                  {item.originalName}
                </h3>

                <div className="space-y-2.5 text-[12.5px] text-neutral-500">
                  <div className="flex items-center gap-2.5">
                    <HardDrive size={13} />
                    <span>{formatBytes(item.fileSize)}</span>
                    <span className="text-white/10">·</span>
                    <span>{item.fileType}</span>
                    <span className="text-white/10">·</span>
                    <span>{item.mimeType.split("/").pop()}</span>
                  </div>
                  {item.caption && (
                    <p className="leading-relaxed">{item.caption}</p>
                  )}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-neutral-400"
                        >
                          <Tag size={9} />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Actions ── */}
              {unlocked && (
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  <button
                    onClick={handleOpenOrDownload}
                    disabled={busy}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.04] py-3.5 text-[11px] font-medium text-neutral-400 ring-1 ring-white/[0.06] transition-all hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:opacity-40"
                  >
                    <Download size={17} />
                    Open
                  </button>
                  <button
                    onClick={() => setShareOpen(true)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.04] py-3.5 text-[11px] font-medium text-neutral-400 ring-1 ring-white/[0.06] transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
                  >
                    <Share2 size={17} />
                    Share
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.04] py-3.5 text-[11px] font-medium text-red-400/70 ring-1 ring-white/[0.06] transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                </div>
              )}

              {/* ── Share modal ── */}
              <ShareModal
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                type="media"
                itemId={item.id}
                itemKey={fileKey}
                itemLabel={item.originalName}
              />
            </FamilyDrawerAnimatedContent>
          </FamilyDrawerAnimatedWrapper>
        </FamilyDrawerContent>
      </FamilyDrawerPortal>
    </FamilyDrawerRoot>
  );
}