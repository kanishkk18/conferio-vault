// // "use client";

// // import { useMemo, useState } from "react";
// // import { Search } from "lucide-react";
// // import { toast } from "sonner";
// // import { useMedia, useDeleteMedia } from "@/hooks/use-media";
// // import { MediaTile } from "@/components/vault/media-tile";
// // import { MediaUploadDropzone } from "@/components/vault/media-upload-dropzone";
// // import type { MediaFileType } from "@securevault/shared-types";

// // const FILE_TYPES: Array<MediaFileType | "all"> = [
// //   "all",
// //   "image",
// //   "video",
// //   "document",
// //   "spreadsheet",
// //   "pdf",
// //   "other",
// // ];

// // export default function MediaPage() {
// //   const [search, setSearch] = useState("");
// //   const [fileType, setFileType] = useState<MediaFileType | "all">("all");
// //   const deleteMutation = useDeleteMedia();

// //   const filters = useMemo(
// //     () => ({
// //       search: search || undefined,
// //       fileType: fileType === "all" ? undefined : fileType,
// //       limit: 40,
// //     }),
// //     [search, fileType]
// //   );

// //   const { data, isLoading, fetchNextPage, hasNextPage } = useMedia(filters);
// //   const items = data?.pages.flatMap((p) => p.items) ?? [];

// //   const handleDelete = async (id: string) => {
// //     if (!confirm("Delete this file? This can't be undone.")) return;
// //     try {
// //       await deleteMutation.mutateAsync(id);
// //       toast.success("File deleted");
// //     } catch {
// //       toast.error("Failed to delete file");
// //     }
// //   };

// //   return (
// //     <div className="flex-1 p-6 space-y-5 overflow-y-auto">
// //       <h1 className="text-xl font-semibold">Media</h1>

// //       <MediaUploadDropzone />

// //       <div className="flex flex-wrap gap-3">
// //         <div className="relative flex-1 min-w-[200px]">
// //           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
// //           <input
// //             placeholder="Search by caption or filename…"
// //             value={search}
// //             onChange={(e) => setSearch(e.target.value)}
// //             className="w-full rounded-lg bg-surface border border-border pl-9 pr-3 py-2 text-sm outline-none focus:border-accent"
// //           />
// //         </div>
// //         <select
// //           value={fileType}
// //           onChange={(e) => setFileType(e.target.value as MediaFileType | "all")}
// //           className="rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
// //         >
// //           {FILE_TYPES.map((t) => (
// //             <option key={t} value={t}>
// //               {t === "all" ? "All files" : t[0]!.toUpperCase() + t.slice(1)}
// //             </option>
// //           ))}
// //         </select>
// //       </div>

// //       {isLoading ? (
// //         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
// //           {Array.from({ length: 12 }).map((_, i) => (
// //             <div key={i} className="aspect-square rounded-xl bg-surface animate-pulse" />
// //           ))}
// //         </div>
// //       ) : items.length === 0 ? (
// //         <div className="text-center py-20 text-muted">
// //           <p className="text-lg mb-1">No files yet</p>
// //           <p className="text-sm">Drag files above to upload your first one.</p>
// //         </div>
// //       ) : (
// //         <>
// //           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
// //             {items.map((item) => (
// //               <MediaTile key={item.id} item={item} onDelete={() => handleDelete(item.id)} />
// //             ))}
// //           </div>
// //           {hasNextPage && (
// //             <button
// //               onClick={() => fetchNextPage()}
// //               className="w-full py-2.5 rounded-lg border border-border hover:bg-surface-hover text-sm text-muted"
// //             >
// //               Load more
// //             </button>
// //           )}
// //         </>
// //       )}
// //     </div>
// //   );
// // }

// "use client";

// import { useMemo, useState } from "react";
// // lib/icons.ts — stable barrel file
// // page.tsx — import from the barrel instead
// import { Search, SlidersHorizontal, Film, ImageIcon } from "@/lib/icons";
// import { toast } from "sonner";
// import { useMedia, useDeleteMedia } from "@/hooks/use-media";
// import { MediaTile } from "@/components/vault/media-tile";
// import { MediaUploadDropzone } from "@/components/vault/media-upload-dropzone";
// import type { MediaFileType } from "@securevault/shared-types";

// const FILE_TYPES: Array<MediaFileType | "all"> = [
//   "all",
//   "image",
//   "video",
//   "document",
//   "spreadsheet",
//   "pdf",
//   "other",
// ];

// export default function MediaPage() {
//   const [search, setSearch] = useState("");
//   const [fileType, setFileType] = useState<MediaFileType | "all">("all");
//   const deleteMutation = useDeleteMedia();

//   const filters = useMemo(
//     () => ({
//       search: search || undefined,
//       fileType: fileType === "all" ? undefined : fileType,
//       limit: 40,
//     }),
//     [search, fileType]
//   );

//   const { data, isLoading, fetchNextPage, hasNextPage } = useMedia(filters);
//   const items = data?.pages.flatMap((p) => p.items) ?? [];

//   const handleDelete = async (id: string) => {
//     if (!confirm("Delete this file? This can't be undone.")) return;
//     try {
//       await deleteMutation.mutateAsync(id);
//       toast.success("File deleted");
//     } catch {
//       toast.error("Failed to delete file");
//     }
//   };

//   return (
//     <div className="flex-1 overflow-y-auto bg-[#070708] text-white">
//       <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 sm:px-6">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white/90">
//             <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
//               <ImageIcon size={13} />
//             </span>
//             SecureX
//           </span>
//           <span className="text-[12px] font-medium text-neutral-500">
//             {items.length} file{items.length === 1 ? "" : "s"}
//           </span>
//         </div>

//         {/* Hero */}
//         <div
//           className="relative mt-8 overflow-hidden rounded-3xl"
//           style={{
//             backgroundImage:
//               "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
//             backgroundSize: "40px 40px",
//           }}
//         >
//           <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#070708]/40 to-[#070708]" />
//           <h1 className="relative flex items-center gap-3 px-1 pb-6 pt-4 text-[42px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[52px]">
//             Media
//             <span className="inline-flex h-[0.72em] w-[1.5em] items-center justify-center rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,0.35)]">
//               <Film size={20} className="text-black" strokeWidth={2.4} />
//             </span>
//           </h1>
//         </div>

//         {/* Upload */}
//         <MediaUploadDropzone />

//         {/* Search + filter */}
//         <div className="mt-6">
//           <div className="relative">
//             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
//             <input
//               placeholder="Search by caption or filename"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-neutral-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none backdrop-blur-xl transition-all duration-200 focus:border-white/25 focus:bg-white/[0.06]"
//             />
//             <SlidersHorizontal size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500" />
//           </div>

//           <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//             {FILE_TYPES.map((t) => {
//               const active = fileType === t;
//               return (
//                 <button
//                   key={t}
//                   onClick={() => setFileType(t)}
//                   className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
//                     active
//                       ? "bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.2)]"
//                       : "bg-white/[0.04] text-neutral-400 ring-1 ring-white/[0.07] hover:text-white"
//                   }`}
//                 >
//                   {t === "all" ? "All files" : t[0]!.toUpperCase() + t.slice(1)}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Grid */}
//         {isLoading ? (
//           <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
//             {Array.from({ length: 8 }).map((_, i) => (
//               <div
//                 key={i}
//                 className="aspect-square animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.03]"
//               />
//             ))}
//           </div>
//         ) : items.length === 0 ? (
//           <div className="mt-16 text-center">
//             <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
//               <ImageIcon size={20} className="text-neutral-500" />
//             </div>
//             <p className="mt-4 text-[15px] font-medium text-white">No files yet</p>
//             <p className="mt-1 text-[13px] text-neutral-500">
//               Drop files above to upload your first one.
//             </p>
//           </div>
//         ) : (
//           <>
//             <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
//               {items.map((item) => (
//                 <MediaTile key={item.id} item={item} onDelete={() => handleDelete(item.id)} />
//               ))}
//             </div>
//             {hasNextPage && (
//               <button
//                 onClick={() => fetchNextPage()}
//                 className="mt-5 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 text-[13px] font-medium text-neutral-400 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:text-white"
//               >
//                 Load more
//               </button>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// // app/(dashboard)/vault/media/page.tsx
// "use client";

// import { useMemo, useState } from "react";
// import {
//   Search,
//   SlidersHorizontal,
//   Film,
//   LayoutGrid,
//   LayoutDashboard,
//   List,
//   Image as ImageIcon,
// } from "lucide-react";
// import { toast } from "sonner";
// import { useMedia, useDeleteMedia } from "@/hooks/use-media";
// import { MediaTile } from "@/components/vault/media-tile";
// import { MediaUploadDropzone } from "@/components/vault/media-upload-dropzone";
// import { MediaDetailDrawer } from "@/components/vault/media-detail-drawer";
// import type { MediaFileType } from "@securevault/shared-types";
// import type { MediaListItem } from "@/hooks/use-media";

// const FILE_TYPES: Array<MediaFileType | "all"> = [
//   "all",
//   "image",
//   "video",
//   "document",
//   "spreadsheet",
//   "pdf",
//   "other",
// ];

// type LayoutMode = "grid" | "masonry" | "list";

// const LAYOUT_OPTIONS: Array<{ mode: LayoutMode; icon: typeof LayoutGrid; label: string }> = [
//   { mode: "grid", icon: LayoutGrid, label: "Grid" },
//   { mode: "masonry", icon: LayoutDashboard, label: "Masonry" },
//   { mode: "list", icon: List, label: "List" },
// ];

// export default function MediaPage() {
//   const [search, setSearch] = useState("");
//   const [fileType, setFileType] = useState<MediaFileType | "all">("all");
//   const [layout, setLayout] = useState<LayoutMode>("grid");
//   const [selectedItem, setSelectedItem] = useState<MediaListItem | null>(null);
//   const deleteMutation = useDeleteMedia();

//   const filters = useMemo(
//     () => ({
//       search: search || undefined,
//       fileType: fileType === "all" ? undefined : fileType,
//       limit: 40,
//     }),
//     [search, fileType],
//   );

//   const { data, isLoading, fetchNextPage, hasNextPage } = useMedia(filters);
//   const items = data?.pages.flatMap((p) => p.items) ?? [];

//   const handleDelete = async (id: string) => {
//     if (!confirm("Delete this file? This can't be undone.")) return;
//     try {
//       await deleteMutation.mutateAsync(id);
//       toast.success("File deleted");
//       setSelectedItem(null);
//     } catch {
//       toast.error("Failed to delete file");
//     }
//   };

//   return (
//     <div className="flex-1 overflow-y-auto bg-[#070708] text-white">
//       <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 sm:px-6">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white/90">
//             <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
//               <ImageIcon size={13} />
//             </span>
//             SecureX
//           </span>
//           <span className="text-[12px] font-medium text-neutral-500">
//             {items.length} file{items.length === 1 ? "" : "s"}
//           </span>
//         </div>

//         {/* Hero */}
//         <div
//           className="relative mt-8 overflow-hidden rounded-3xl"
//           style={{
//             backgroundImage:
//               "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
//             backgroundSize: "40px 40px",
//           }}
//         >
//           <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#070708]/40 to-[#070708]" />
//           <h1 className="relative flex items-center gap-3 px-1 pb-6 pt-4 text-[42px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[52px]">
//             Media
//             <span className="inline-flex h-[0.72em] w-[1.5em] items-center justify-center rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,0.35)]">
//               <Film size={20} className="text-black" strokeWidth={2.4} />
//             </span>
//           </h1>
//         </div>

//         {/* Upload */}
//         <MediaUploadDropzone />

//         {/* Search + filter + layout toggle */}
//         <div className="mt-6">
//           <div className="relative">
//             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
//             <input
//               placeholder="Search by caption or filename"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-neutral-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none backdrop-blur-xl transition-all duration-200 focus:border-white/25 focus:bg-white/[0.06]"
//             />
//             <SlidersHorizontal size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500" />
//           </div>

//           <div className="mt-3 flex items-center gap-2">
//             {/* File type pills */}
//             <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//               {FILE_TYPES.map((t) => {
//                 const active = fileType === t;
//                 return (
//                   <button
//                     key={t}
//                     onClick={() => setFileType(t)}
//                     className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
//                       active
//                         ? "bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.2)]"
//                         : "bg-white/[0.04] text-neutral-400 ring-1 ring-white/[0.07] hover:text-white"
//                     }`}
//                   >
//                     {t === "all" ? "All files" : t[0]!.toUpperCase() + t.slice(1)}
//                   </button>
//                 );
//               })}
//             </div>

//             {/* Layout toggle */}
//             <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.07]">
//               {LAYOUT_OPTIONS.map(({ mode, icon: LIcon, label }) => (
//                 <button
//                   key={mode}
//                   onClick={() => setLayout(mode)}
//                   aria-label={label}
//                   className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
//                     layout === mode
//                       ? "bg-white/15 text-white"
//                       : "text-neutral-500 hover:text-white"
//                   }`}
//                 >
//                   <LIcon size={15} />
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* ── Content ── */}
//         {isLoading ? (
//           <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
//             {Array.from({ length: 8 }).map((_, i) => (
//               <div
//                 key={i}
//                 className="aspect-square animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.03]"
//               />
//             ))}
//           </div>
//         ) : items.length === 0 ? (
//           <div className="mt-16 text-center">
//             <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
//               <ImageIcon size={20} className="text-neutral-500" />
//             </div>
//             <p className="mt-4 text-[15px] font-medium text-white">No files yet</p>
//             <p className="mt-1 text-[13px] text-neutral-500">
//               Drop files above to upload your first one.
//             </p>
//           </div>
//         ) : layout === "grid" ? (
//           <GridView
//             items={items}
//             onDelete={(id) => handleDelete(id)}
//             onSelect={setSelectedItem}
//             hasNextPage={hasNextPage}
//             fetchNextPage={fetchNextPage}
//           />
//         ) : layout === "masonry" ? (
//           <MasonryView
//             items={items}
//             onDelete={(id) => handleDelete(id)}
//             onSelect={setSelectedItem}
//             hasNextPage={hasNextPage}
//             fetchNextPage={fetchNextPage}
//           />
//         ) : (
//           <ListView
//             items={items}
//             onDelete={(id) => handleDelete(id)}
//             onSelect={setSelectedItem}
//             hasNextPage={hasNextPage}
//             fetchNextPage={fetchNextPage}
//           />
//         )}
//       </div>

//       {/* Detail drawer */}
//       <MediaDetailDrawer
//         item={selectedItem}
//         open={selectedItem !== null}
//         onClose={() => setSelectedItem(null)}
//         onDelete={() => selectedItem && handleDelete(selectedItem.id)}
//       />
//     </div>
//   );
// }

// /* ──────────────────────────────────────────────────────────────────────── */
// /* Layout sub-components                                                    */
// /* ──────────────────────────────────────────────────────────────────────── */

// function LoadMoreButton({
//   hasNextPage,
//   fetchNextPage,
// }: {
//   hasNextPage: boolean;
//   fetchNextPage: () => void;
// }) {
//   if (!hasNextPage) return null;
//   return (
//     <button
//       onClick={() => fetchNextPage()}
//       className="mt-5 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 text-[13px] font-medium text-neutral-400 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:text-white"
//     >
//       Load more
//     </button>
//   );
// }

// /** Grid — 2/3/4 columns, square tiles */
// function GridView({
//   items,
//   onDelete,
//   onSelect,
//   hasNextPage,
//   fetchNextPage,
// }: {
//   items: MediaListItem[];
//   onDelete: (id: string) => void;
//   onSelect: (item: MediaListItem) => void;
//   hasNextPage: boolean;
//   fetchNextPage: () => void;
// }) {
//   return (
//     <>
//       <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
//         {items.map((item) => (
//           <MediaTile
//             key={item.id}
//             item={item}
//             onDelete={() => onDelete(item.id)}
//             onSelect={() => onSelect(item)}
//           />
//         ))}
//       </div>
//       <LoadMoreButton hasNextPage={hasNextPage} fetchNextPage={fetchNextPage} />
//     </>
//   );
// }

// /** Masonry — CSS multi-column, aspect-native tiles */
// function MasonryView({
//   items,
//   onDelete,
//   onSelect,
//   hasNextPage,
//   fetchNextPage,
// }: {
//   items: MediaListItem[];
//   onDelete: (id: string) => void;
//   onSelect: (item: MediaListItem) => void;
//   hasNextPage: boolean;
//   fetchNextPage: () => void;
// }) {
//   return (
//     <>
//       <div className="mt-5 columns-2 gap-3 sm:columns-3 md:columns-4">
//         {items.map((item) => (
//           <button
//             key={item.id}
//             onClick={() => onSelect(item)}
//             className="mb-3 break-inside-avoid w-full"
//           >
//             <MediaTile
//               item={item}
//               onDelete={() => onDelete(item.id)}
//               onSelect={() => onSelect(item)}
//               masonry
//             />
//           </button>
//         ))}
//       </div>
//       <LoadMoreButton hasNextPage={hasNextPage} fetchNextPage={fetchNextPage} />
//     </>
//   );
// }

// /** List — single column rows */
// function ListView({
//   items,
//   onDelete,
//   onSelect,
//   hasNextPage,
//   fetchNextPage,
// }: {
//   items: MediaListItem[];
//   onDelete: (id: string) => void;
//   onSelect: (item: MediaListItem) => void;
//   hasNextPage: boolean;
//   fetchNextPage: () => void;
// }) {
//   return (
//     <>
//       <div className="mt-5 flex flex-col gap-2">
//         {items.map((item) => (
//           <button
//             key={item.id}
//             onClick={() => onSelect(item)}
//             className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left transition-all hover:bg-white/[0.06] active:scale-[0.99]"
//           >
//             <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
//               <ImageIcon size={18} className="text-neutral-500" />
//             </div>
//             <div className="min-w-0 flex-1">
//               <p className="truncate text-[13px] font-medium text-white">
//                 {item.originalName}
//               </p>
//               <p className="mt-0.5 text-[11px] text-neutral-500">
//                 {item.fileType} · {item.fileSize >= 1024 ** 2
//                   ? `${(item.fileSize / 1024 ** 2).toFixed(1)} MB`
//                   : `${(item.fileSize / 1024).toFixed(0)} KB`}
//               </p>
//             </div>
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onDelete(item.id);
//               }}
//               className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
//             >
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                 <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
//               </svg>
//             </button>
//           </button>
//         ))}
//       </div>
//       <LoadMoreButton hasNextPage={hasNextPage} fetchNextPage={fetchNextPage} />
//     </>
//   );
// }

"use client";

import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Film,
  LayoutGrid,
  LayoutDashboard,
  List,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useMedia, useDeleteMedia } from "@/hooks/use-media";
import { MediaTile } from "@/components/vault/media-tile";
import { MediaUploadDropzone } from "@/components/vault/media-upload-dropzone";
import { MediaDetailDrawer } from "@/components/vault/media-detail-drawer";
import type { MediaFileType } from "@securevault/shared-types";
import type { MediaListItem } from "@/hooks/use-media";

const FILE_TYPES: Array<MediaFileType | "all"> = [
  "all",
  "image",
  "video",
  "document",
  "spreadsheet",
  "pdf",
  "other",
];

type LayoutMode = "grid" | "masonry" | "list";

const LAYOUT_OPTIONS: Array<{
  mode: LayoutMode;
  icon: typeof LayoutGrid;
  label: string;
}> = [
  { mode: "grid", icon: LayoutGrid, label: "Grid" },
  { mode: "masonry", icon: LayoutDashboard, label: "Masonry" },
  { mode: "list", icon: List, label: "List" },
];

export default function MediaPage() {
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState<MediaFileType | "all">("all");
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [selectedItem, setSelectedItem] = useState<MediaListItem | null>(null);
  const deleteMutation = useDeleteMedia();

  const filters = useMemo(
    () => ({
      search: search || undefined,
      fileType: fileType === "all" ? undefined : fileType,
      limit: 40,
    }),
    [search, fileType],
  );

  const { data, isLoading, fetchNextPage, hasNextPage } = useMedia(filters);
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file? This can't be undone.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("File deleted");
      setSelectedItem(null);
    } catch {
      toast.error("Failed to delete file");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#070708] text-white">
      <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white/90">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
              <ImageIcon size={13} />
            </span>
            SecureX
          </span>
          <span className="text-[12px] font-medium text-neutral-500">
            {items.length} file{items.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Hero */}
        <div
          className="relative mt-8 overflow-hidden rounded-3xl"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#070708]/40 to-[#070708]" />
          <h1 className="relative flex items-center gap-3 px-1 pb-6 pt-4 text-[42px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[52px]">
            Media
            <span className="inline-flex h-[0.72em] w-[1.5em] items-center justify-center rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,0.35)]">
              <Film size={20} className="text-black" strokeWidth={2.4} />
            </span>
          </h1>
        </div>

        {/* Upload */}
        <MediaUploadDropzone />

        {/* Search + filter + layout toggle */}
        <div className="mt-6">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              placeholder="Search by caption or filename"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-neutral-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none backdrop-blur-xl transition-all duration-200 focus:border-white/25 focus:bg-white/[0.06]"
            />
            <SlidersHorizontal
              size={15}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            {/* File type pills */}
            <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILE_TYPES.map((t) => {
                const active = fileType === t;
                return (
                  <button
                    key={t}
                    onClick={() => setFileType(t)}
                    className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? "bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                        : "bg-white/[0.04] text-neutral-400 ring-1 ring-white/[0.07] hover:text-white"
                    }`}
                  >
                    {t === "all" ? "All files" : t[0]!.toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>

            {/* Layout toggle */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.07]">
              {LAYOUT_OPTIONS.map(({ mode, icon: LIcon, label }) => (
                <button
                  key={mode}
                  onClick={() => setLayout(mode)}
                  aria-label={label}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                    layout === mode
                      ? "bg-white/15 text-white"
                      : "text-neutral-500 hover:text-white"
                  }`}
                >
                  <LIcon size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.03]"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
              <ImageIcon size={20} className="text-neutral-500" />
            </div>
            <p className="mt-4 text-[15px] font-medium text-white">
              No files yet
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">
              Drop files above to upload your first one.
            </p>
          </div>
        ) : layout === "grid" ? (
          <GridView
            items={items}
            onDelete={(id) => handleDelete(id)}
            onSelect={setSelectedItem}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
          />
        ) : layout === "masonry" ? (
          <MasonryView
            items={items}
            onDelete={(id) => handleDelete(id)}
            onSelect={setSelectedItem}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
          />
        ) : (
          <ListView
            items={items}
            onDelete={(id) => handleDelete(id)}
            onSelect={setSelectedItem}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
          />
        )}
      </div>

      {/* Detail drawer */}
      <MediaDetailDrawer
        item={selectedItem}
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        onDelete={() => selectedItem && handleDelete(selectedItem.id)}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Layout sub-components                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function LoadMoreButton({
  hasNextPage,
  fetchNextPage,
}: {
  hasNextPage: boolean;
  fetchNextPage: () => void;
}) {
  if (!hasNextPage) return null;
  return (
    <button
      onClick={() => fetchNextPage()}
      className="mt-5 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 text-[13px] font-medium text-neutral-400 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:text-white"
    >
      Load more
    </button>
  );
}

/** Grid — 2/3/4 columns, square tiles */
function GridView({
  items,
  onDelete,
  onSelect,
  hasNextPage,
  fetchNextPage,
}: {
  items: MediaListItem[];
  onDelete: (id: string) => void;
  onSelect: (item: MediaListItem) => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}) {
  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <MediaTile
            key={item.id}
            item={item}
            onDelete={() => onDelete(item.id)}
            onSelect={() => onSelect(item)}
          />
        ))}
      </div>
      <LoadMoreButton hasNextPage={hasNextPage} fetchNextPage={fetchNextPage} />
    </>
  );
}

/** Masonry — CSS multi-column, aspect-native tiles (no nested buttons) */
function MasonryView({
  items,
  onDelete,
  onSelect,
  hasNextPage,
  fetchNextPage,
}: {
  items: MediaListItem[];
  onDelete: (id: string) => void;
  onSelect: (item: MediaListItem) => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}) {
  return (
    <>
      <div className="mt-5 columns-2 gap-3 sm:columns-3 md:columns-4">
        {items.map((item) => (
          <div key={item.id} className="mb-3 break-inside-avoid w-full">
            <MediaTile
              item={item}
              onDelete={() => onDelete(item.id)}
              onSelect={() => onSelect(item)}
              masonry
            />
          </div>
        ))}
      </div>
      <LoadMoreButton hasNextPage={hasNextPage} fetchNextPage={fetchNextPage} />
    </>
  );
}

/** List — single column rows (div with role="button", child delete button is not nested) */
function ListView({
  items,
  onDelete,
  onSelect,
  hasNextPage,
  fetchNextPage,
}: {
  items: MediaListItem[];
  onDelete: (id: string) => void;
  onSelect: (item: MediaListItem) => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}) {
  return (
    <>
      <div className="mt-5 flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(item);
              }
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 cursor-pointer transition-all hover:bg-white/[0.06] active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
              <ImageIcon size={18} className="text-neutral-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">
                {item.originalName}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                {item.fileType} ·{" "}
                {item.fileSize >= 1024 ** 2
                  ? `${(item.fileSize / 1024 ** 2).toFixed(1)} MB`
                  : `${(item.fileSize / 1024).toFixed(0)} KB`}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <LoadMoreButton hasNextPage={hasNextPage} fetchNextPage={fetchNextPage} />
    </>
  );
}