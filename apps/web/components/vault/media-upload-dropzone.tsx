// "use client";

// import { useRef, useState } from "react";
// import { Upload, Lock } from "lucide-react";
// import { toast } from "sonner";
// import { useMediaUpload } from "@/hooks/use-media-upload";
// import { useVaultKeyStore } from "@/store/vault-key-store";

// export function MediaUploadDropzone() {
//   const masterKey = useVaultKeyStore((s) => s.masterKey);
//   const uploadMutation = useMediaUpload();
//   const inputRef = useRef<HTMLInputElement>(null);
//   const [dragging, setDragging] = useState(false);
//   const [protectWithPassword, setProtectWithPassword] = useState(false);
//   const [filePassword, setFilePassword] = useState("");
//   const [progress, setProgress] = useState<number | null>(null);

//   const handleFiles = async (files: FileList | null) => {
//     if (!files || files.length === 0) return;
//     if (!masterKey) {
//       toast.error("Vault is locked.");
//       return;
//     }
//     if (protectWithPassword && filePassword.length < 4) {
//       toast.error("File password must be at least 4 characters.");
//       return;
//     }

//     for (const file of Array.from(files)) {
//       setProgress(0);
//       try {
//         const result = await uploadMutation.mutateAsync({
//           file,
//           masterKey,
//           filePassword: protectWithPassword ? filePassword : undefined,
//           onProgress: setProgress,
//         });
//         if (result.status === "queued") {
//           toast.info(`You're offline — ${file.name} will finish uploading automatically once you're back online.`);
//         } else {
//           toast.success(`${file.name} uploaded`);
//         }
//       } catch (err) {
//         toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
//       } finally {
//         setProgress(null);
//       }
//     }
//   };

//   return (
//     <div className="space-y-2">
//       <div
//         onDragOver={(e) => {
//           e.preventDefault();
//           setDragging(true);
//         }}
//         onDragLeave={() => setDragging(false)}
//         onDrop={(e) => {
//           e.preventDefault();
//           setDragging(false);
//           handleFiles(e.dataTransfer.files);
//         }}
//         onClick={() => inputRef.current?.click()}
//         className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
//           dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
//         }`}
//       >
//         <input
//           ref={inputRef}
//           type="file"
//           multiple
//           className="hidden"
//           onChange={(e) => handleFiles(e.target.files)}
//         />
//         <Upload className="mx-auto mb-2 text-muted" size={28} />
//         <p className="text-sm">Drag & drop files here, or click to browse</p>
//         <p className="text-xs text-muted mt-1">
//           Images, videos, PDFs, and documents — encrypted in your browser before upload
//         </p>
//         <p className="text-[11px] text-muted/70 mt-1">
//           Note: unlike passwords, uploaded media can be viewed by SecureVault admins for support
//           purposes.
//         </p>
//         {progress !== null && (
//           <div className="mt-3 h-1.5 rounded-full bg-surface-hover overflow-hidden max-w-xs mx-auto">
//             <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
//           </div>
//         )}
//       </div>

//       <label
//         className="flex items-center gap-2 text-xs text-muted px-1"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <input
//           type="checkbox"
//           checked={protectWithPassword}
//           onChange={(e) => setProtectWithPassword(e.target.checked)}
//         />
//         <Lock size={12} />
//         Require a separate password for the next file(s) I upload
//       </label>
//       {protectWithPassword && (
//         <input
//           type="password"
//           value={filePassword}
//           onChange={(e) => setFilePassword(e.target.value)}
//           placeholder="File-specific password (min 4 characters)"
//           className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//         />
//       )}
//     </div>
//   );
// }


// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Upload, Lock, ChevronRight } from "lucide-react";
// import { toast } from "sonner";
// import { useMediaUpload } from "@/hooks/use-media-upload";
// import { useVaultKeyStore } from "@/store/vault-key-store";

// export function MediaUploadDropzone() {
//   const masterKey = useVaultKeyStore((s) => s.masterKey);
//   const uploadMutation = useMediaUpload();
//   const inputRef = useRef<HTMLInputElement>(null);
//   const [dragging, setDragging] = useState(false);
//   const [protectWithPassword, setProtectWithPassword] = useState(false);
//   const [filePassword, setFilePassword] = useState("");
//   const [progress, setProgress] = useState<number | null>(null);

//   // Listen for the mobile nav "+" button (Media upload option)
//   useEffect(() => {
//     const open = () => inputRef.current?.click();
//     window.addEventListener("securevault:new-media", open);
//     return () => window.removeEventListener("securevault:new-media", open);
//   }, []);

//   const handleFiles = async (files: FileList | null) => {
//     if (!files || files.length === 0) return;
//     if (!masterKey) {
//       toast.error("Vault is locked.");
//       return;
//     }
//     if (protectWithPassword && filePassword.length < 4) {
//       toast.error("File password must be at least 4 characters.");
//       return;
//     }

//     for (const file of Array.from(files)) {
//       setProgress(0);
//       try {
//         const result = await uploadMutation.mutateAsync({
//           file,
//           masterKey,
//           filePassword: protectWithPassword ? filePassword : undefined,
//           onProgress: setProgress,
//         });
//         if (result.status === "queued") {
//           toast.info(`You're offline — ${file.name} will finish uploading automatically once you're back online.`);
//         } else {
//           toast.success(`${file.name} uploaded`);
//         }
//       } catch (err) {
//         toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
//       } finally {
//         setProgress(null);
//       }
//     }
//   };

//   return (
//     <div className="mt-6 space-y-2.5">
//       <div
//         onDragOver={(e) => {
//           e.preventDefault();
//           setDragging(true);
//         }}
//         onDragLeave={() => setDragging(false)}
//         onDrop={(e) => {
//           e.preventDefault();
//           setDragging(false);
//           handleFiles(e.dataTransfer.files);
//         }}
//         onClick={() => inputRef.current?.click()}
//         className={`flex cursor-pointer items-center gap-3.5 rounded-[20px] border p-3.5 backdrop-blur-xl transition-all duration-200 ${
//           dragging
//             ? "border-white/30 bg-white/[0.08] shadow-[0_0_40px_rgba(255,255,255,0.08)]"
//             : "border-white/[0.08] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/[0.16] hover:bg-white/[0.06]"
//         }`}
//       >
//         <input
//           ref={inputRef}
//           type="file"
//           multiple
//           className="hidden"
//           onChange={(e) => handleFiles(e.target.files)}
//         />
//         <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_0_28px_rgba(255,255,255,0.3)]">
//           <Upload size={17} strokeWidth={2.2} />
//         </div>
//         <div className="min-w-0 flex-1">
//           <p className="text-[13px] font-semibold text-white">
//             Drop files here, or click to browse
//           </p>
//           <p className="mt-0.5 truncate text-[11px] text-neutral-500">
//             Encrypted in your browser before upload
//           </p>
//           {progress !== null && (
//             <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
//               <div
//                 className="h-full rounded-full bg-white transition-all"
//                 style={{ width: `${progress}%` }}
//               />
//             </div>
//           )}
//         </div>
//         <ChevronRight size={16} className="shrink-0 text-neutral-500" />
//       </div>

//       <label className="flex items-center gap-2 px-1 text-[11.5px] text-neutral-500">
//         <input
//           type="checkbox"
//           checked={protectWithPassword}
//           onChange={(e) => setProtectWithPassword(e.target.checked)}
//         />
//         <Lock size={11} />
//         Require a separate password for the next file(s) I upload
//       </label>
//       {protectWithPassword && (
//         <input
//           type="password"
//           value={filePassword}
//           onChange={(e) => setFilePassword(e.target.value)}
//           placeholder="File-specific password (min 4 characters)"
//           className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[12.5px] text-white outline-none backdrop-blur-xl placeholder:text-neutral-600 transition-all duration-200 focus:border-white/25"
//         />
//       )}
      
//     </div>
//   );
// }

// components/vault/media-upload-dropzone.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Lock, ChevronRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useMediaUpload, MAX_UPLOAD_SIZE_BYTES } from "@/hooks/use-media-upload";
import { useVaultKeyStore } from "@/store/vault-key-store";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(0)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function MediaUploadDropzone() {
  const masterKey = useVaultKeyStore((s) => s.masterKey);
  const uploadMutation = useMediaUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [protectWithPassword, setProtectWithPassword] = useState(false);
  const [filePassword, setFilePassword] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  useEffect(() => {
    const open = () => inputRef.current?.click();
    window.addEventListener("securevault:new-media", open);
    return () => window.removeEventListener("securevault:new-media", open);
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!masterKey) {
      toast.error("Vault is locked.");
      return;
    }
    if (protectWithPassword && filePassword.length < 4) {
      toast.error("File password must be at least 4 characters.");
      return;
    }

    /* ── Pre-validate every file against the env limit ── */
    const oversized = Array.from(files).find((f) => f.size > MAX_UPLOAD_SIZE_BYTES);
    if (oversized) {
      toast.error(
        `${oversized.name} is ${formatBytes(oversized.size)} — exceeds the ${formatBytes(MAX_UPLOAD_SIZE_BYTES)} limit.`,
        { duration: 6_000 },
      );
      return;
    }

    for (const file of Array.from(files)) {
      setCurrentFile(file.name);
      setProgress(0);
      try {
        const result = await uploadMutation.mutateAsync({
          file,
          masterKey,
          filePassword: protectWithPassword ? filePassword : undefined,
          onProgress: setProgress,
        });
        if (result.status === "queued") {
          toast.info(
            `You're offline — ${file.name} will upload automatically once you're back online.`,
          );
        } else {
          toast.success(`${file.name} uploaded`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`, {
          duration: 5_000,
        });
      } finally {
        setProgress(null);
        setCurrentFile(null);
      }
    }
  };

  const isUploading = progress !== null;

  return (
    <div className="mt-6 space-y-2.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`flex cursor-pointer items-center gap-3.5 rounded-[20px] border p-3.5 backdrop-blur-xl transition-all duration-200 ${
          isUploading
            ? "border-white/15 bg-white/[0.06] pointer-events-none"
            : dragging
              ? "border-white/30 bg-white/[0.08] shadow-[0_0_40px_rgba(255,255,255,0.08)]"
              : "border-white/[0.08] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/[0.16] hover:bg-white/[0.06]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isUploading}
        />

        <div
          className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full shadow-[0_0_28px_rgba(255,255,255,0.3)] transition-colors ${
            isUploading ? "bg-white/80" : "bg-white"
          }`}
        >
          <Upload size={17} strokeWidth={2.2} className="text-black" />
        </div>

        <div className="min-w-0 flex-1">
          {isUploading ? (
            <>
              <p className="text-[13px] font-semibold text-white truncate">
                Encrypting & uploading…
              </p>
              <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                {currentFile}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold text-white">
                Drop files here, or click to browse
              </p>
              <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                Encrypted in your browser · up to {formatBytes(MAX_UPLOAD_SIZE_BYTES)}
              </p>
            </>
          )}
        </div>

        {!isUploading && <ChevronRight size={16} className="shrink-0 text-neutral-500" />}
      </div>

      {/* File-password toggle */}
      <label className="flex items-center gap-2 px-1 text-[11.5px] text-neutral-500">
        <input
          type="checkbox"
          checked={protectWithPassword}
          onChange={(e) => setProtectWithPassword(e.target.checked)}
          disabled={isUploading}
        />
        <Lock size={11} />
        Require a separate password for the next file(s) I upload
      </label>
      {protectWithPassword && (
        <input
          type="password"
          value={filePassword}
          onChange={(e) => setFilePassword(e.target.value)}
          placeholder="File-specific password (min 4 characters)"
          disabled={isUploading}
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[12.5px] text-white outline-none backdrop-blur-xl placeholder:text-neutral-600 transition-all duration-200 focus:border-white/25 disabled:opacity-40"
        />
      )}
    </div>
  );
}