"use client";

import { useEffect, useState } from "react";
import { Lock, FileText, Film, FileSpreadsheet, File as FileIcon, Download, Trash2, Share2 } from "lucide-react";
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

const FILE_ICONS: Record<string, typeof FileText> = {
  document: FileText,
  video: Film,
  spreadsheet: FileSpreadsheet,
  pdf: FileText,
  other: FileIcon,
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function MediaTile({
  item,
  onDelete,
  onSelect,
  masonry = false,
}: {
  item: MediaListItem;
  onDelete: () => void;
  onSelect?: () => void;
  masonry?: boolean;
}) {
  const masterKey = useVaultKeyStore((s) => s.masterKey);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(!item.requiresPassword);
  const [password, setPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [fileKey, setFileKey] = useState<CryptoKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Auto-decrypt the thumbnail for normal (non-protected) items as soon as
  // the vault is unlocked — no extra click needed, per spec.
  useEffect(() => {
    let objectUrl: string | null = null;
    async function run() {
      if (item.requiresPassword || !masterKey || !item.thumbnailKey) return;
      try {
        const key = await getFileKeyForNormalItem(item, masterKey);
        setFileKey(key);
        const url = await decryptThumbnail(item, key);
        objectUrl = url;
        setThumbnailUrl(url);
      } catch {
        // Silently fall back to the generic icon tile — the reveal action
        // on click will surface a clearer error if the key is truly wrong.
      }
    }
    run();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, masterKey]);

  const handleUnlockWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const key = await getFileKeyForProtectedItem(item.id, password);
      setFileKey(key);
      setUnlocked(true);
      setShowPasswordPrompt(false);
      setPassword("");
      const url = await decryptThumbnail(item, key);
      setThumbnailUrl(url);
    } catch (err) {
      toast.error(err instanceof MediaUnlockError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleOpenOrDownload = async () => {
    if (item.requiresPassword && !unlocked) {
      setShowPasswordPrompt(true);
      return;
    }
    if (!fileKey) {
      toast.error("Vault is locked.");
      return;
    }
    setBusy(true);
    try {
      const blob = await decryptFullFile(item, fileKey);
      if (item.mimeType.startsWith("image/") || item.mimeType === "application/pdf") {
        window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
      } else {
        triggerDownload(blob, item.originalName);
      }
    } catch {
      toast.error("Failed to decrypt file.");
    } finally {
      setBusy(false);
    }
  };

  if (item.requiresPassword && !unlocked) {
    const Icon = FILE_ICONS[item.fileType] ?? Lock;
    return (
      <div className="aspect-square rounded-xl border border-border bg-surface p-3 flex flex-col items-center justify-center gap-2 text-center">
        {showPasswordPrompt ? (
          <form onSubmit={handleUnlockWithPassword} className="w-full space-y-2">
            <Lock size={20} className="mx-auto text-muted" />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="File password"
              className="w-full rounded-md bg-background border border-border px-2 py-1 text-xs text-center outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || !password}
              className="w-full py-1 rounded-md bg-accent hover:bg-accent-hover disabled:opacity-50 text-xs font-medium"
            >
              {busy ? "…" : "Unlock"}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowPasswordPrompt(true)}
            className="flex flex-col items-center gap-2 text-muted hover:text-foreground"
          >
            <Icon size={24} />
            <span className="text-xs">Password protected</span>
          </button>
        )}
      </div>
    );
  }

  const Icon = FILE_ICONS[item.fileType];

  return (
   <div className={`group relative rounded-xl border border-border bg-[#080808] overflow-hidden ${masonry ? "" : "aspect-square"}`}> 
   
  <button onClick={onSelect ?? handleOpenOrDownload}
    className="w-full h-full flex items-center justify-center"> 
    {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt={item.caption ?? item.originalName} className="w-full h-full object-cover" />
        ) : Icon ? (
          <Icon size={32} className="text-muted" />
        ) : (
          <div className="text-3xl"><FileIcon size={32} className="text-muted" /></div>
        )}
      </button>

      <div className="absolute inset-x-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] text-white truncate">{item.originalName}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={handleOpenOrDownload} className="text-white/80 hover:text-white">
            <Download size={13} />
          </button>
          {fileKey && (
            <button
              onClick={() => setShareOpen(true)}
              className="text-white/80 hover:text-accent"
            >
              <Share2 size={13} />
            </button>
          )}
          <button onClick={onDelete} className="text-white/80 hover:text-danger">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {item.requiresPassword && (
        <div className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-1">
          <Lock size={11} className="text-white" />
        </div>
      )}

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        type="media"
        itemId={item.id}
        itemKey={fileKey}
        itemLabel={item.originalName}
      />
    </div>
  );
}
