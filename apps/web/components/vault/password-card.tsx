// "use client";

// import { useState } from "react";
// import { Eye, EyeOff, Copy, Pencil, Trash2, ExternalLink, Share2 } from "lucide-react";
// import { toast } from "sonner";
// import type { PasswordListItem } from "@/hooks/use-passwords";
// import { revealPassword, getPasswordItemKey, VaultUnlockError } from "@/hooks/use-reveal-password";
// import { useVaultKeyStore } from "@/store/vault-key-store";
// import { ShareModal } from "./share-modal";

// const CATEGORY_COLORS: Record<string, string> = {
//   social: "bg-blue-500/15 text-blue-400",
//   banking: "bg-green-500/15 text-green-400",
//   work: "bg-purple-500/15 text-purple-400",
//   other: "bg-gray-500/15 text-gray-400",
// };

// export function PasswordCard({
//   item,
//   onEdit,
//   onDelete,
// }: {
//   item: PasswordListItem;
//   onEdit: () => void;
//   onDelete: () => void;
// }) {
//   const masterKey = useVaultKeyStore((s) => s.masterKey);
//   const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
//   const [revealing, setRevealing] = useState(false);
//   const [autoHideTimer, setAutoHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
//   const [shareOpen, setShareOpen] = useState(false);
//   const [shareItemKey, setShareItemKey] = useState<CryptoKey | null>(null);

//   const handleOpenShare = async () => {
//     if (!masterKey) return toast.error("Vault is locked.");
//     try {
//       const key = await getPasswordItemKey(item, masterKey);
//       setShareItemKey(key);
//       setShareOpen(true);
//     } catch (err) {
//       toast.error(err instanceof VaultUnlockError ? err.message : "Couldn't prepare this item for sharing.");
//     }
//   };

//   const scheduleAutoHide = () => {
//     if (autoHideTimer) clearTimeout(autoHideTimer);
//     const timer = setTimeout(() => setRevealedPassword(null), 30_000); // 30s auto-hide per spec
//     setAutoHideTimer(timer);
//   };

//   const handleToggleReveal = async () => {
//     if (revealedPassword) {
//       setRevealedPassword(null);
//       if (autoHideTimer) clearTimeout(autoHideTimer);
//       return;
//     }
//     if (!masterKey) {
//       toast.error("Vault is locked.");
//       return;
//     }
//     setRevealing(true);
//     try {
//       const data = await revealPassword(item, masterKey);
//       setRevealedPassword(data.password);
//       scheduleAutoHide();
//     } catch (err) {
//       if (err instanceof VaultUnlockError) {
//         toast.error(err.message);
//       } else {
//         toast.error("Failed to decrypt password.");
//       }
//     } finally {
//       setRevealing(false);
//     }
//   };

//   const handleCopyUsername = () => {
//     navigator.clipboard.writeText(item.username);
//     toast.success("Username copied");
//   };

//   const handleCopyPassword = async () => {
//     if (!masterKey) {
//       toast.error("Vault is locked.");
//       return;
//     }
//     try {
//       const data = revealedPassword
//         ? { password: revealedPassword }
//         : await revealPassword(item, masterKey);
//       navigator.clipboard.writeText(data.password);
//       toast.success("Password copied");
//     } catch (err) {
//       toast.error(err instanceof VaultUnlockError ? err.message : "Failed to decrypt password.");
//     }
//   };

//   return (
//     <div className="rounded-xl border border-border bg-surface p-4 space-y-3 hover:border-accent/40 transition-colors">
//       <div className="flex items-start justify-between">
//         <div className="flex items-center gap-2.5 min-w-0">
//           <div className="h-9 w-9 rounded-lg bg-surface-hover flex items-center justify-center text-lg shrink-0">
//             {item.icon ?? "🔑"}
//           </div>
//           <div className="min-w-0">
//             <h3 className="font-medium truncate">{item.title}</h3>
//             <span
//               className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 ${
//                 CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other
//               }`}
//             >
//               {item.category}
//             </span>
//           </div>
//         </div>
//         {item.url && (
//           <a
//             href={item.url}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="text-muted hover:text-accent shrink-0"
//           >
//             <ExternalLink size={14} />
//           </a>
//         )}
//       </div>

//       <div className="space-y-1.5">
//         <div className="flex items-center justify-between gap-2 text-sm">
//           <span className="text-muted truncate">{item.username}</span>
//           <button onClick={handleCopyUsername} className="text-muted hover:text-accent shrink-0">
//             <Copy size={14} />
//           </button>
//         </div>
//         <div className="flex items-center justify-between gap-2 text-sm font-mono">
//           <span className="truncate">
//             {revealing ? "Decrypting…" : revealedPassword ?? "••••••••••••"}
//           </span>
//           <div className="flex items-center gap-2 shrink-0">
//             <button onClick={handleToggleReveal} className="text-muted hover:text-accent">
//               {revealedPassword ? <EyeOff size={14} /> : <Eye size={14} />}
//             </button>
//             <button onClick={handleCopyPassword} className="text-muted hover:text-accent">
//               <Copy size={14} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {item.tags.length > 0 && (
//         <div className="flex flex-wrap gap-1">
//           {item.tags.map((tag) => (
//             <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-muted">
//               {tag}
//             </span>
//           ))}
//         </div>
//       )}

//       <div className="flex items-center gap-2 pt-1 border-t border-border">
//         <button
//           onClick={onEdit}
//           className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground py-1"
//         >
//           <Pencil size={12} /> Edit
//         </button>
//         <button
//           onClick={handleOpenShare}
//           className="flex items-center gap-1.5 text-xs text-muted hover:text-accent py-1"
//         >
//           <Share2 size={12} /> Share
//         </button>
//         <button
//           onClick={onDelete}
//           className="flex items-center gap-1.5 text-xs text-muted hover:text-danger py-1"
//         >
//           <Trash2 size={12} /> Delete
//         </button>
//       </div>

//       <ShareModal
//         open={shareOpen}
//         onClose={() => setShareOpen(false)}
//         type="password"
//         itemId={item.id}
//         itemKey={shareItemKey}
//         itemLabel={item.title}
//       />
//     </div>
//   );
// }

"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Copy, Pencil, Trash2, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { PasswordListItem } from "@/hooks/use-passwords";
import { revealPassword, getPasswordItemKey, VaultUnlockError } from "@/hooks/use-reveal-password";
import { useVaultKeyStore } from "@/store/vault-key-store";
import { ShareModal } from "./share-modal";

const CATEGORY_COLORS: Record<string, string> = {
  social: "bg-blue-500/15 text-blue-400",
  banking: "bg-green-500/15 text-green-400",
  work: "bg-purple-500/15 text-purple-400",
  other: "bg-gray-500/15 text-gray-400",
};

export function PasswordCard({
  item,
  onEdit,
  onDelete,
}: {
  item: PasswordListItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const masterKey = useVaultKeyStore((s) => s.masterKey);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareItemKey, setShareItemKey] = useState<CryptoKey | null>(null);

  // ✨ Decorative strength indicator (visual only — replace with a real score field if you have one)
  const strength = useMemo(() => {
    let n = 0;
    for (const ch of item.id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
    return { bars: (n % 4) + 1, score: 6 + (n % 5) };
  }, [item.id]);

  const handleOpenShare = async () => {
    if (!masterKey) return toast.error("Vault is locked.");
    try {
      const key = await getPasswordItemKey(item, masterKey);
      setShareItemKey(key);
      setShareOpen(true);
    } catch (err) {
      toast.error(err instanceof VaultUnlockError ? err.message : "Couldn't prepare this item for sharing.");
    }
  };

  const scheduleAutoHide = () => {
    if (autoHideTimer) clearTimeout(autoHideTimer);
    const timer = setTimeout(() => setRevealedPassword(null), 30_000); // 30s auto-hide per spec
    setAutoHideTimer(timer);
  };

  const handleToggleReveal = async () => {
    if (revealedPassword) {
      setRevealedPassword(null);
      if (autoHideTimer) clearTimeout(autoHideTimer);
      return;
    }
    if (!masterKey) {
      toast.error("Vault is locked.");
      return;
    }
    setRevealing(true);
    try {
      const data = await revealPassword(item, masterKey);
      setRevealedPassword(data.password);
      scheduleAutoHide();
    } catch (err) {
      if (err instanceof VaultUnlockError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to decrypt password.");
      }
    } finally {
      setRevealing(false);
    }
  };

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(item.username);
    toast.success("Username copied");
  };

  const handleCopyPassword = async () => {
    if (!masterKey) {
      toast.error("Vault is locked.");
      return;
    }
    try {
      const data = revealedPassword
        ? { password: revealedPassword }
        : await revealPassword(item, masterKey);
      navigator.clipboard.writeText(data.password);
      toast.success("Password copied");
    } catch (err) {
      toast.error(err instanceof VaultUnlockError ? err.message : "Failed to decrypt password.");
    }
  };

  return (
    <div className="group relative flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.5)]">
      {/* Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.05] text-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        {item.icon ?? "🔑"}
      </div>

      {/* Main content — tapping opens edit */}
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-medium text-white">{item.title}</h3>
          <span
            className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide sm:inline-block ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other
              }`}
          >
            {item.category}
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-[13px]">
          <span className="truncate text-neutral-500">{item.username}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyUsername();
            }}
            className="shrink-0 text-neutral-600 transition-colors hover:text-white"
          >
            <Copy size={12} />
          </button>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[13px]">
          <span className="truncate text-neutral-400">
            {revealing ? (
              <span className="text-neutral-500">Decrypting…</span>
            ) : revealedPassword ? (
              <span className="text-white">{revealedPassword}</span>
            ) : (
              <span className="tracking-widest text-neutral-600">••••••••••••</span>
            )}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleReveal();
            }}
            className="shrink-0 text-neutral-600 transition-colors hover:text-white"
          >
            {revealedPassword ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyPassword();
            }}
            className="shrink-0 text-neutral-600 transition-colors hover:text-white"
          >
            <Copy size={13} />
          </button>
        </div>
      </div>

      {/* Strength bars + score (visual only) */}
      <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
        <div className="flex items-end gap-[3px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full transition-colors ${i < strength.bars ? "bg-white" : "bg-white/15"
                }`}
              style={{ height: 6 + i * 3 }}
            />
          ))}
        </div>
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-[10px] font-semibold text-white shadow-[0_0_12px_rgba(255,255,255,0.08)]">
          {strength.score}
        </span>
      </div>

      {/* Row actions — subtle, brighten on hover (always visible on touch) */}
      <div className="absolute -top-2.5 right-3 flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-[#141416] px-1 py-0.5 opacity-100 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink size={12} />
          </a>
        )}
        <button
          onClick={onEdit}
          className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={handleOpenShare}
          className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Share2 size={12} />
        </button>
        <button
          onClick={onDelete}
          className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        type="password"
        itemId={item.id}
        itemKey={shareItemKey}
        itemLabel={item.title}
      />
    </div>
  );
}