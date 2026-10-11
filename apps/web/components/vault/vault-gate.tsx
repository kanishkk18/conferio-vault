// "use client";

// import { useState } from "react";
// import { toast } from "sonner";
// import { VaultEncryption } from "@securevault/encryption";
// import { authClient } from "@/lib/auth-client";
// import { useVaultKeyStore } from "@/store/vault-key-store";

// export function VaultGate({ children }: { children: React.ReactNode }) {
//   const { data: sessionData, isPending } = authClient.useSession();
//   const isUnlocked = useVaultKeyStore((s) => s.isUnlocked);
//   const setMasterKey = useVaultKeyStore((s) => s.setMasterKey);
//   const [password, setPassword] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   if (isPending) {
//     return <div className="flex-1 flex items-center justify-center text-muted">Loading…</div>;
//   }

//   if (isUnlocked) {
//     return <>{children}</>;
//   }

//   // @ts-expect-error -- additionalFields aren't in the base session type
//   const masterKeySalt: string | null | undefined = sessionData?.user?.masterKeySalt;

//   if (!masterKeySalt) {
//     return (
//       <div className="flex-1 flex items-center justify-center p-6 text-center">
//         <div className="max-w-sm space-y-3">
//           <p className="text-sm text-muted">
//             Your vault password isn&apos;t set up yet. Let&apos;s finish that first.
//           </p>
//           <a
//             href="/vault-setup"
//             className="inline-block px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover font-medium text-sm"
//           >
//             Set up vault password
//           </a>
//         </div>
//       </div>
//     );
//   }

//   const handleUnlock = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitting(true);
//     try {
//       const rateLimitRes = await fetch("/api/vault/unlock", { method: "POST" });
//       if (rateLimitRes.status === 429) {
//         const body = await rateLimitRes.json();
//         toast.error(body.error);
//         return;
//       }

//       const masterKey = await VaultEncryption.deriveMasterKey(password, masterKeySalt);
//       setMasterKey(masterKey);
//       setPassword("");
//     } catch {
//       toast.error("Couldn't unlock the vault. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="flex-1 flex items-center justify-center p-6">
//       <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4 text-center">
//         <div className="text-3xl">🔒</div>
//         <div className="space-y-1">
//           <h2 className="text-lg font-semibold">Vault locked</h2>
//           <p className="text-sm text-muted">
//             Enter your vault password to unlock your session.
//           </p>
//         </div>
//         <input
//           type="password"
//           autoFocus
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-center outline-none focus:border-accent"
//           placeholder="Vault password"
//         />
//         <button
//           type="submit"
//           disabled={submitting || !password}
//           className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 font-medium transition-colors"
//         >
//           {submitting ? "Unlocking…" : "Unlock"}
//         </button>
//         <p className="text-xs text-muted">
//           Note: an incorrect password won&apos;t show an error here — you&apos;ll see it when you
//           try to reveal a hidden item.
//         </p>
//       </form>
//     </div>
//   );
// }


// "use client";

// import { useState } from "react";
// import { toast } from "sonner";
// import { VaultEncryption } from "@securevault/encryption";
// import { authClient } from "@/lib/auth-client";
// import { useVaultKeyStore } from "@/store/vault-key-store";
// import { Lock } from "lucide-react";

// export function VaultGate({ children }: { children: React.ReactNode }) {
//   const { data: sessionData, isPending } = authClient.useSession();
//   const isUnlocked = useVaultKeyStore((s) => s.isUnlocked);
//   const setMasterKey = useVaultKeyStore((s) => s.setMasterKey);
//   const [password, setPassword] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   if (isPending) {
//     return (
//       <div className="flex-1 flex items-center justify-center text-neutral-500">
//         Loading…
//       </div>
//     );
//   }

//   if (isUnlocked) {
//     return <>{children}</>;
//   }

//   // @ts-expect-error -- additionalFields aren't in the base session type
//   const masterKeySalt: string | null | undefined = sessionData?.user?.masterKeySalt;

//   if (!masterKeySalt) {
//     return (
//       <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-[#0a0a0b] p-6">
//         <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
//           <Lock size={20} className="text-white/60" strokeWidth={2.2} />
//         </div>
//         <p className="text-[13px] text-neutral-500 text-center max-w-[240px]">
//           Your vault password isn&apos;t set up yet. Let&apos;s finish that first.
//         </p>
//         <a
//           href="/vault-setup"
//           className="inline-flex items-center justify-center rounded-2xl bg-white px-8 h-[48px] text-[14px] font-semibold text-black shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.97] transition-transform"
//         >
//           Set up vault password
//         </a>
//       </div>
//     );
//   }

//   const handleUnlock = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!password) return;
//     setSubmitting(true);
//     try {
//       const rateLimitRes = await fetch("/api/vault/unlock", { method: "POST" });
//       if (rateLimitRes.status === 429) {
//         const body = await rateLimitRes.json();
//         toast.error(body.error);
//         return;
//       }

//       const masterKey = await VaultEncryption.deriveMasterKey(password, masterKeySalt);
//       setMasterKey(masterKey);
//       setPassword("");
//     } catch {
//       toast.error("Couldn't unlock the vault. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="flex flex-1 flex-col items-center bg-[#0a0a0b] text-white">
//       <div className="flex w-full max-w-[360px] flex-1 flex-col items-center justify-between px-6 pb-10 pt-14">

//         {/* ── Top ── */}
//         <div className="flex flex-col items-center gap-4">
//           <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
//             <Lock size={20} className="text-white/60" strokeWidth={2.2} />
//           </div>
//           <div className="text-center">
//             <h2 className="text-[15px] font-semibold tracking-tight text-white/90">
//               Vault password
//             </h2>
//             <p className="mt-1.5 text-[13px] text-neutral-500">
//               Enter your vault password to unlock
//             </p>
//           </div>
//         </div>

//         {/* ── Middle ── */}
//         <form onSubmit={handleUnlock} className="flex w-full max-w-[280px] flex-col gap-4">
//           <input
//             type="password"
//             autoFocus
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Password"
//             className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-center text-[15px] tracking-[0.12em] text-white placeholder:text-neutral-600 placeholder:tracking-normal shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-xl transition-all duration-200 focus:border-white/20 focus:bg-white/[0.06]"
//           />
//           <button
//             type="submit"
//             disabled={submitting || !password}
//             className="h-[48px] w-full rounded-2xl bg-white text-[14px] font-semibold text-black shadow-[0_0_30px_rgba(255,255,255,0.12)] disabled:opacity-25 disabled:shadow-none transition-all duration-200 active:scale-[0.97]"
//           >
//             {submitting ? "Unlocking…" : "Unlock"}
//           </button>
//         </form>

//         {/* ── Bottom spacer to push content up symmetrically ── */}
//         <div className="h-[52px]" />
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { VaultEncryption } from "@securevault/encryption";
import { authClient } from "@/lib/auth-client";
import { useVaultKeyStore } from "@/store/vault-key-store";
import { Lock, ArrowRight } from "lucide-react";

export function VaultGate({ children }: { children: React.ReactNode }) {
  const { data: sessionData, isPending } = authClient.useSession();
  const isUnlocked = useVaultKeyStore((s) => s.isUnlocked);
  const setMasterKey = useVaultKeyStore((s) => s.setMasterKey);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-500">
        Loading…
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  const masterKeySalt: string | null | undefined = sessionData?.user?.masterKeySalt;

  if (!masterKeySalt) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#07070c] p-6">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.07] blur-[90px]" />

        <div className="relative flex w-full max-w-[340px] flex-col items-center gap-5 rounded-[28px] border border-white/[0.07] bg-white/[0.03] px-8 py-10 shadow-[0_25px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl">
          <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white shadow-[0_0_50px_rgba(255,255,255,0.25)]">
            <Lock size={26} className="text-black" strokeWidth={2.2} />
          </div>
          <div className="text-center">
            <h2 className="text-[17px] font-semibold tracking-tight text-white">
              Vault not set up
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
              Your vault password isn&apos;t set up yet. Let&apos;s finish that first.
            </p>
          </div>
          <a
            href="/vault-setup"
            className="mt-1 inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black shadow-[0_0_35px_rgba(255,255,255,0.2)] transition-all duration-200 hover:shadow-[0_0_50px_rgba(255,255,255,0.35)] active:scale-[0.97]"
          >
            Set up vault password
            <ArrowRight size={16} strokeWidth={2.4} />
          </a>
        </div>
      </div>
    );
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    try {
      const rateLimitRes = await fetch("/api/vault/unlock", { method: "POST" });
      if (rateLimitRes.status === 429) {
        const body = await rateLimitRes.json();
        toast.error(body.error);
        return;
      }

      const masterKey = await VaultEncryption.deriveMasterKey(password, masterKeySalt);
      setMasterKey(masterKey);
      setPassword("");
    } catch {
      toast.error("Couldn't unlock the vault. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#07070c] px-6">
      {/* Ambient glows — soft blue light like the reference */}
      <div className="pointer-events-none absolute left-1/2 top-[30%] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.08] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-80px] right-[-60px] h-[260px] w-[260px] rounded-full bg-blue-500/[0.05] blur-[90px]" />

      {/* Card */}
      <div className="relative flex w-full max-w-[340px] flex-col items-center gap-4 rounded-[28px] border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.015] px-7 py-10 shadow-[0_25px_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
        {/* Glowing lock */}
        <div className="flex h-[120px] w-[120px] items-center justify-center">
          <video src="/lock-video.webm" autoPlay loop muted className="w-full h-full object-cover"></video>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-[18px] font-semibold tracking-tight text-white">
            Vault password
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">
            Enter your vault password to unlock
          </p>
        </div>

        {/* Input + arrow button — arrow appears after first character */}
        <form onSubmit={handleUnlock} className="w-full">
          <div
            className={`flex items-center rounded-full border bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-300 ${password
              ? "border-white/[0.18] pl-5"
              : "border-white/[0.08] pl-5"
              }`}
          >
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] tracking-[0.1em] text-white placeholder:text-neutral-600 placeholder:tracking-normal outline-none"
            />
            {/* Arrow button — only visible after first character */}
            <button
              type="submit"
              disabled={submitting}
              aria-label="Unlock vault"
              className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.35)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 ${password
                ? "mr-1 translate-x-0 opacity-100"
                : "pointer-events-none mr-0 translate-x-2 opacity-0"
                }`}
            >
              {submitting ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              ) : (
                <ArrowRight size={17} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}