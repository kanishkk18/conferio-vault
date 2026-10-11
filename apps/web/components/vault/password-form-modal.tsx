// "use client";

// import { useEffect, useState } from "react";
// import { X, Wand2 } from "lucide-react";
// import { toast } from "sonner";
// import { useCreatePassword, useUpdatePassword } from "@/hooks/use-password-mutations";
// import { useVaultKeyStore } from "@/store/vault-key-store";
// import { revealPassword } from "@/hooks/use-reveal-password";
// import { PasswordGeneratorPanel } from "./password-generator-panel";
// import type { PasswordListItem } from "@/hooks/use-passwords";
// import type { PasswordCategory } from "@securevault/shared-types";

// const CATEGORIES: PasswordCategory[] = ["social", "banking", "work", "other"];

// interface PasswordFormModalProps {
//   open: boolean;
//   onClose: () => void;
//   editingItem?: PasswordListItem | null;
// }

// export function PasswordFormModal({ open, onClose, editingItem }: PasswordFormModalProps) {
//   const masterKey = useVaultKeyStore((s) => s.masterKey);
//   const createMutation = useCreatePassword();
//   const updateMutation = useUpdatePassword();

//   const [title, setTitle] = useState("");
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [notes, setNotes] = useState("");
//   const [url, setUrl] = useState("");
//   const [category, setCategory] = useState<PasswordCategory>("other");
//   const [tagsInput, setTagsInput] = useState("");
//   const [isHidden, setIsHidden] = useState(false);
//   const [showGenerator, setShowGenerator] = useState(false);
//   const [loadingExisting, setLoadingExisting] = useState(false);

//   useEffect(() => {
//     if (!open) return;

//     if (editingItem && masterKey) {
//       setLoadingExisting(true);
//       setTitle(editingItem.title);
//       setUsername(editingItem.username);
//       setUrl(editingItem.url ?? "");
//       setCategory(editingItem.category as PasswordCategory);
//       setTagsInput(editingItem.tags.join(", "));
//       setIsHidden(editingItem.isHidden);

//       revealPassword(editingItem, masterKey)
//         .then((data) => {
//           setPassword(data.password);
//           setNotes(data.notes ?? "");
//         })
//         .catch(() => toast.error("Couldn't decrypt existing password — wrong vault password?"))
//         .finally(() => setLoadingExisting(false));
//     } else {
//       setTitle("");
//       setUsername("");
//       setPassword("");
//       setNotes("");
//       setUrl("");
//       setCategory("other");
//       setTagsInput("");
//       setIsHidden(false);
//     }
//   }, [open, editingItem, masterKey]);

//   if (!open) return null;

//   const isSaving = createMutation.isPending || updateMutation.isPending;

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!masterKey) {
//       toast.error("Vault is locked.");
//       return;
//     }
//     if (!title || !username || !password) {
//       toast.error("Title, username, and password are required.");
//       return;
//     }

//     const input = {
//       title,
//       username,
//       password,
//       notes,
//       url,
//       category,
//       tags: tagsInput
//         .split(",")
//         .map((t) => t.trim())
//         .filter(Boolean),
//       isHidden,
//     };

//     try {
//       if (editingItem) {
//         await updateMutation.mutateAsync({ id: editingItem.id, input, masterKey });
//         toast.success("Password updated");
//       } else {
//         await createMutation.mutateAsync({ input, masterKey });
//         toast.success("Password saved");
//       }
//       onClose();
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Failed to save");
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
//       <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 max-h-[90vh] overflow-y-auto">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-lg font-semibold">
//             {editingItem ? "Edit password" : "Add password"}
//           </h2>
//           <button onClick={onClose} className="text-muted hover:text-foreground">
//             <X size={18} />
//           </button>
//         </div>

//         {loadingExisting ? (
//           <div className="py-10 text-center text-sm text-muted">Decrypting…</div>
//         ) : (
//           <form onSubmit={handleSubmit} className="space-y-3">
//             <input
//               placeholder="Title (e.g. Instagram)"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//             />
//             <input
//               placeholder="Username or email"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//             />

//             <div className="space-y-1.5">
//               <div className="flex gap-2">
//                 <input
//                   type="text"
//                   placeholder="Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="flex-1 rounded-lg bg-background border border-border px-3 py-2 text-sm font-mono outline-none focus:border-accent"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowGenerator((s) => !s)}
//                   className="px-3 rounded-lg border border-border hover:bg-surface-hover"
//                   title="Generate password"
//                 >
//                   <Wand2 size={16} />
//                 </button>
//               </div>
//               {showGenerator && <PasswordGeneratorPanel onGenerate={setPassword} />}
//             </div>

//             <input
//               placeholder="URL (optional)"
//               value={url}
//               onChange={(e) => setUrl(e.target.value)}
//               className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//             />

//             <div className="flex gap-2">
//               <select
//                 value={category}
//                 onChange={(e) => setCategory(e.target.value as PasswordCategory)}
//                 className="flex-1 rounded-lg bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//               >
//                 {CATEGORIES.map((c) => (
//                   <option key={c} value={c}>
//                     {c[0]!.toUpperCase() + c.slice(1)}
//                   </option>
//                 ))}
//               </select>
//               <input
//                 placeholder="Tags (comma separated)"
//                 value={tagsInput}
//                 onChange={(e) => setTagsInput(e.target.value)}
//                 className="flex-1 rounded-lg bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//               />
//             </div>

//             <textarea
//               placeholder="Notes (optional)"
//               value={notes}
//               onChange={(e) => setNotes(e.target.value)}
//               rows={2}
//               className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm outline-none focus:border-accent resize-none"
//             />

//             <label className="flex items-center gap-2 text-sm text-muted">
//               <input
//                 type="checkbox"
//                 checked={isHidden}
//                 onChange={(e) => setIsHidden(e.target.checked)}
//               />
//               Require vault password to view this item
//             </label>

//             <button
//               type="submit"
//               disabled={isSaving}
//               className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 font-medium transition-colors"
//             >
//               {isSaving ? "Saving…" : editingItem ? "Save changes" : "Add password"}
//             </button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { Wand2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useCreatePassword, useUpdatePassword } from "@/hooks/use-password-mutations";
import { useVaultKeyStore } from "@/store/vault-key-store";
import { revealPassword } from "@/hooks/use-reveal-password";
import { PasswordGeneratorPanel } from "./password-generator-panel";
import type { PasswordListItem } from "@/hooks/use-passwords";
import type { PasswordCategory } from "@securevault/shared-types";
import {
  FamilyDrawerAnimatedContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerContent,
  FamilyDrawerRoot,
  FamilyDrawerClose,
  FamilyDrawerPortal,
  FamilyDrawerOverlay,
} from "@/components/ui/family-drawer";

const CATEGORIES: PasswordCategory[] = ["social", "banking", "work", "other"];

interface PasswordFormDrawerProps {
  open: boolean;
  onClose: () => void;
  editingItem?: PasswordListItem | null;
}

export function PasswordFormModal({ open, onClose, editingItem }: PasswordFormDrawerProps) {
  const masterKey = useVaultKeyStore((s) => s.masterKey);
  const createMutation = useCreatePassword();
  const updateMutation = useUpdatePassword();

  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<PasswordCategory>("other");
  const [tagsInput, setTagsInput] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editingItem && masterKey) {
      setLoadingExisting(true);
      setTitle(editingItem.title);
      setUsername(editingItem.username);
      setUrl(editingItem.url ?? "");
      setCategory(editingItem.category as PasswordCategory);
      setTagsInput(editingItem.tags.join(", "));
      setIsHidden(editingItem.isHidden);
      setShowGenerator(false);

      revealPassword(editingItem, masterKey)
        .then((data) => {
          setPassword(data.password);
          setNotes(data.notes ?? "");
        })
        .catch(() =>
          toast.error("Couldn't decrypt — wrong vault password?"),
        )
        .finally(() => setLoadingExisting(false));
    } else {
      setTitle("");
      setUsername("");
      setPassword("");
      setNotes("");
      setUrl("");
      setCategory("other");
      setTagsInput("");
      setIsHidden(false);
      setShowGenerator(false);
    }
  }, [open, editingItem, masterKey]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey) {
      toast.error("Vault is locked.");
      return;
    }
    if (!title || !username || !password) {
      toast.error("Title, username, and password are required.");
      return;
    }

    const input = {
      title,
      username,
      password,
      notes,
      url,
      category,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isHidden,
    };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, input, masterKey });
        toast.success("Password updated");
      } else {
        await createMutation.mutateAsync({ input, masterKey });
        toast.success("Password saved");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  /* ── shared input style ── */
  const field =
    "w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[13.5px] text-white outline-none backdrop-blur-xl placeholder:text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 focus:border-white/20 focus:bg-white/[0.06]";

  return (
    <FamilyDrawerRoot open={open} onOpenChange={(v) => !v && onClose()}>
      <FamilyDrawerPortal>
        <FamilyDrawerOverlay
          className="bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />
        <FamilyDrawerContent className="bg-[#111111] border-t border-white/[0.08] max-w-md">
          {/* Close — repositioned + re-styled for dark sheet */}
          <FamilyDrawerClose className="bg-white/[0.08] text-white/50 hover:bg-white/[0.14] top-4 right-5 h-7 w-7" />

          <FamilyDrawerAnimatedWrapper className="px-5 pt-1.5 pb-10 overflow-y-auto !h-[70vh] ">
            <FamilyDrawerAnimatedContent>
              {loadingExisting ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                  <p className="mt-3 text-[13px] text-neutral-500">
                    Decrypting…
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-3.5"
                  data-vaul-no-drag
                >
                  {/* ── Header ── */}
                  <div className="flex items-center gap-3 pb-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
                      <KeyRound
                        size={16}
                        className="text-white/60"
                        strokeWidth={2.2}
                      />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-semibold text-white/90">
                        {editingItem ? "Edit password" : "New password"}
                      </h2>
                      <p className="text-[12px] text-neutral-500">
                        {editingItem
                          ? "Update saved credentials"
                          : "Save a login securely"}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-white/[0.06]" />

                  {/* ── Title ── */}
                  <input
                    placeholder="Title (e.g. Instagram)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={field}
                  />

                  {/* ── Username ── */}
                  <input
                    placeholder="Username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={field}
                  />

                  {/* ── Password + generator toggle ── */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${field} flex-1 font-mono tracking-wider`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGenerator((s) => !s)}
                        className={`flex w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 ${
                          showGenerator
                            ? "border-white/20 bg-white/[0.1] text-white"
                            : "border-white/[0.08] bg-white/[0.04] text-neutral-500 hover:border-white/[0.16]"
                        }`}
                      >
                        <Wand2 size={15} />
                      </button>
                    </div>
                    {showGenerator && (
                      <PasswordGeneratorPanel onGenerate={setPassword} />
                    )}
                  </div>

                  {/* ── URL ── */}
                  <input
                    placeholder="URL (optional)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={field}
                  />

                  {/* ── Category pills ── */}
                  <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {CATEGORIES.map((c) => {
                      const active = category === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(c)}
                          className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-medium transition-all duration-200 ${
                            active
                              ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                              : "bg-white/[0.04] text-neutral-400 ring-1 ring-white/[0.07] hover:text-white"
                          }`}
                        >
                          {c[0]!.toUpperCase() + c.slice(1)}
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Tags ── */}
                  <input
                    placeholder="Tags (comma separated)"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className={field}
                  />

                  {/* ── Notes ── */}
                  <textarea
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className={`${field} resize-none`}
                  />

                  {/* ── Visibility toggle ── */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                    <span className="text-[13px] text-neutral-400">
                      Require vault password to view
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isHidden}
                      onClick={() => setIsHidden(!isHidden)}
                      className={`relative inline-flex h-[26px] w-[46px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/30 ${
                        isHidden ? "bg-white" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`pointer-events-none block h-[22px] w-[22px] rounded-full shadow-sm transition-transform duration-200 ${
                          isHidden
                            ? "translate-x-[24px] bg-[#111111]"
                            : "translate-x-[2px] bg-white/40"
                        }`}
                      />
                    </button>
                  </div>

                  {/* ── Submit ── */}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="h-[48px] w-full rounded-2xl bg-white text-[14px] font-semibold text-black shadow-[0_0_30px_rgba(255,255,255,0.12)] disabled:opacity-30 disabled:shadow-none transition-all duration-200 active:scale-[0.97]"
                  >
                    {isSaving
                      ? "Saving…"
                      : editingItem
                        ? "Save changes"
                        : "Add password"}
                  </button>
                </form>
              )}
            </FamilyDrawerAnimatedContent>
          </FamilyDrawerAnimatedWrapper>
        </FamilyDrawerContent>
      </FamilyDrawerPortal>
    </FamilyDrawerRoot>
  );
}
