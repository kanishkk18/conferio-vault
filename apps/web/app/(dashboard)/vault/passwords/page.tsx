// "use client";

// import { useMemo, useState } from "react";
// import { Plus, Search } from "lucide-react";
// import { toast } from "sonner";
// import { usePasswords, type PasswordListItem } from "@/hooks/use-passwords";
// import { useDeletePassword } from "@/hooks/use-password-mutations";
// import { PasswordCard } from "@/components/vault/password-card";
// import { PasswordFormModal } from "@/components/vault/password-form-modal";
// import type { PasswordCategory } from "@securevault/shared-types";

// const CATEGORIES: Array<PasswordCategory | "all"> = ["all", "social", "banking", "work", "other"];

// export default function PasswordsPage() {
//   const [search, setSearch] = useState("");
//   const [category, setCategory] = useState<PasswordCategory | "all">("all");
//   const [sort, setSort] = useState<"recent" | "alphabetical" | "category">("recent");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editingItem, setEditingItem] = useState<PasswordListItem | null>(null);

//   const filters = useMemo(
//     () => ({
//       search: search || undefined,
//       category: category === "all" ? undefined : category,
//       sort,
//       limit: 30,
//     }),
//     [search, category, sort]
//   );

//   const { data, isLoading, fetchNextPage, hasNextPage } = usePasswords(filters);
//   const deleteMutation = useDeletePassword();

//   const items = data?.pages.flatMap((p) => p.items) ?? [];

//   const handleDelete = async (id: string) => {
//     if (!confirm("Delete this password? This can't be undone.")) return;
//     try {
//       await deleteMutation.mutateAsync(id);
//       toast.success("Password deleted");
//     } catch {
//       toast.error("Failed to delete password");
//     }
//   };

//   return (
//     <div className="flex-1 p-6 space-y-5 overflow-y-auto">
//       <div className="flex flex-wrap items-center gap-3 justify-between">
//         <h1 className="text-xl font-semibold">Passwords</h1>
//         <button
//           onClick={() => {
//             setEditingItem(null);
//             setModalOpen(true);
//           }}
//           className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-sm font-medium transition-colors"
//         >
//           <Plus size={16} /> Add new
//         </button>
//       </div>

//       <div className="flex flex-wrap gap-3">
//         <div className="relative flex-1 min-w-[200px]">
//           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
//           <input
//             placeholder="Search passwords…"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full rounded-lg bg-surface border border-border pl-9 pr-3 py-2 text-sm outline-none focus:border-accent"
//           />
//         </div>
//         <select
//           value={category}
//           onChange={(e) => setCategory(e.target.value as PasswordCategory | "all")}
//           className="rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//         >
//           {CATEGORIES.map((c) => (
//             <option key={c} value={c}>
//               {c === "all" ? "All categories" : c[0]!.toUpperCase() + c.slice(1)}
//             </option>
//           ))}
//         </select>
//         <select
//           value={sort}
//           onChange={(e) => setSort(e.target.value as typeof sort)}
//           className="rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//         >
//           <option value="recent">Most recent</option>
//           <option value="alphabetical">A–Z</option>
//           <option value="category">Category</option>
//         </select>
//       </div>

//       {isLoading ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {Array.from({ length: 6 }).map((_, i) => (
//             <div key={i} className="h-40 rounded-xl bg-surface animate-pulse" />
//           ))}
//         </div>
//       ) : items.length === 0 ? (
//         <div className="text-center py-20 text-muted">
//           <p className="text-lg mb-1">No passwords yet</p>
//           <p className="text-sm">Click &quot;Add new&quot; to save your first password.</p>
//         </div>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             {items.map((item) => (
//               <PasswordCard
//                 key={item.id}
//                 item={item}
//                 onEdit={() => {
//                   setEditingItem(item);
//                   setModalOpen(true);
//                 }}
//                 onDelete={() => handleDelete(item.id)}
//               />
//             ))}
//           </div>
//           {hasNextPage && (
//             <button
//               onClick={() => fetchNextPage()}
//               className="w-full py-2.5 rounded-lg border border-border hover:bg-surface-hover text-sm text-muted"
//             >
//               Load more
//             </button>
//           )}
//         </>
//       )}

//       <PasswordFormModal
//         open={modalOpen}
//         onClose={() => setModalOpen(false)}
//         editingItem={editingItem}
//       />
//     </div>
//   );
// }


"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Lock, Wand2, ChevronRight, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { usePasswords, type PasswordListItem } from "@/hooks/use-passwords";
import { useDeletePassword } from "@/hooks/use-password-mutations";
import { PasswordCard } from "@/components/vault/password-card";
import { PasswordFormModal } from "@/components/vault/password-form-modal";
import type { PasswordCategory } from "@securevault/shared-types";
import LightRays from '../../../../components/LightRays';


const CATEGORIES: Array<PasswordCategory | "all"> = ["all", "social", "banking", "work", "other"];

export default function PasswordsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PasswordCategory | "all">("all");
  const [sort, setSort] = useState<"recent" | "alphabetical" | "category">("recent");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PasswordListItem | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category === "all" ? undefined : category,
      sort,
      limit: 30,
    }),
    [search, category, sort]
  );

  const { data, isLoading, fetchNextPage, hasNextPage } = usePasswords(filters);
  const deleteMutation = useDeletePassword();

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this password? This can't be undone.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Password deleted");
    } catch {
      toast.error("Failed to delete password");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#11111] text-white">
      <div style={{ width: '100%', height: '300px', position: 'absolute' }} className="!-z-10 opacity-90">
  <LightRays
    raysOrigin="top-center"
    raysColor="#ffffff"
    raysSpeed={1}
    lightSpread={0.5}
    rayLength={3}
    followMouse={true}
    mouseInfluence={0.1}
    noiseAmount={0}
    distortion={0}
    className="custom-rays"
    pulsating={false}
    fadeDistance={1}
    saturation={1}
/>
</div>

      <div className="px-3 w-full pb-28 sm:px-6 !z-[9999]">
        
       
      {/* <div
          className="absolute mt-0 overflow-hidden rounded-3xl"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        /> */}
        {/* ── Hero heading with subtle grid backdrop ─────────── */}
         
        <div
          className="relative overflow-hidden"
        >
          <div className="flex items-center justify-between bg-transparent py-3 px-0.5">
          <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white/90">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
              <Lock size={13} />
            </span>
            SecureX
          </span>
          <button
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all duration-200 hover:shadow-[0_0_45px_rgba(255,255,255,0.4)] active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} /> Add new
          </button>
        </div>
          <div className="pointer-events-none absolute inset-0" />
          <h1 className="relative px-1 pb-6 pt-4 text-[42px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[52px]">
            Keep
            <span className="mx-2 inline-flex h-[0.72em] w-[1.5em] translate-y-[0.06em] items-center justify-center rounded-full bg-white align-middle shadow-[0_0_40px_rgba(255,255,255,0.35)]">
              <Lock size={20} className="text-black" strokeWidth={2.4} />
            </span>
            <br />
            Your Life
            <br />
            Safe
            <span className="mx-2 inline-flex h-[0.72em] w-[1.5em] translate-y-[0.06em] items-center justify-center rounded-full bg-white align-middle shadow-[0_0_40px_rgba(255,255,255,0.35)]">
              <Lock size={20} className="text-black" strokeWidth={2.4} />
            </span>
          </h1>
        </div>

        {/* ── Search ─────────────────────────────────────────── */}
        <div className="relative mt-2">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            placeholder="Search account, name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-neutral-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none backdrop-blur-xl transition-all duration-200 focus:border-white/25 focus:bg-white/[0.06]"
          />
          <SlidersHorizontal size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        </div>

        {/* ── AutoFill banner ────────────────────────────────── */}
        <button className="mt-4 flex w-full items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.05]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <Wand2 size={18} strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium text-white">Enjoy the magic of AutoFill</span>
            <span className="block text-[12px] text-neutral-500">Stay Safe, Stay Secure</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-neutral-500" />
        </button>

        {/* ── Category tabs + sort ───────────────────────────── */}
        <div className="mt-6 flex items-center gap-2">
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                      : "bg-white/[0.04] text-neutral-400 ring-1 ring-white/[0.07] hover:text-white"
                  }`}
                >
                  {c === "all" ? "Today" : c[0]!.toUpperCase() + c.slice(1)}
                </button>
              );
            })}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-neutral-400 outline-none backdrop-blur-xl transition-colors focus:border-white/25"
          >
            <option value="recent" className="bg-[#121214]">Most recent</option>
            <option value="alphabetical" className="bg-[#121214]">A–Z</option>
            <option value="category" className="bg-[#121214]">Category</option>
          </select>
        </div>

        {/* ── List ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[76px] animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.03]"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
              <Lock size={20} className="text-neutral-500" />
            </div>
            <p className="mt-4 text-[15px] font-medium text-white">No passwords yet</p>
            <p className="mt-1 text-[13px] text-neutral-500">Tap &quot;Add new&quot; to save your first password.</p>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <PasswordCard
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    setEditingItem(item);
                    setModalOpen(true);
                  }}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                className="mt-5 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 text-[13px] font-medium text-neutral-400 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:text-white"
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>

      <PasswordFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingItem={editingItem}
      />
    </div>
  );
}