// "use client";

// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { KeyRound, Image as ImageIcon, Share2, Settings, LogOut } from "lucide-react";
// import { authClient } from "@/lib/auth-client";
// import { useVaultKeyStore } from "@/store/vault-key-store";

// const NAV_ITEMS = [
//   { href: "/vault/passwords", label: "Passwords", icon: KeyRound },
//   { href: "/vault/media", label: "Media", icon: ImageIcon },
//   { href: "/shared", label: "Shared with me", icon: Share2 },
//   { href: "/settings", label: "Settings", icon: Settings },
// ];

// export function Sidebar({
//   userName,
//   userEmail,
// }: {
//   userName?: string | null;
//   userEmail?: string | null;
// }) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const lock = useVaultKeyStore((s) => s.lock);

//   const handleSignOut = async () => {
//     lock();
//     await authClient.signOut();
//     router.push("/login");
//   };

//   return (
//     <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-surface p-4">
//       <div className="px-2 py-3">
//         <span className="text-lg font-semibold">🔒 SecureVault</span>
//       </div>

//       <nav className="mt-4 flex-1 space-y-1">
//         {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
//           const active = pathname?.startsWith(href);
//           return (
//             <Link
//               key={href}
//               href={href}
//               className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
//                 active
//                   ? "bg-accent/15 text-accent"
//                   : "text-muted hover:bg-surface-hover hover:text-foreground"
//               }`}
//             >
//               <Icon size={18} />
//               {label}
//             </Link>
//           );
//         })}
//       </nav>

//       <div className="border-t border-border pt-3 space-y-2">
//         <div className="px-2 text-xs text-muted truncate">
//           {userName ? <div className="text-foreground">{userName}</div> : null}
//           <div className="truncate">{userEmail}</div>
//         </div>
//         <button
//           onClick={handleSignOut}
//           className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-hover hover:text-danger transition-colors"
//         >
//           <LogOut size={18} />
//           Sign out
//         </button>
//       </div>
//     </aside>
//   );
// }

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KeyRound, Image as ImageIcon, Share2, Settings, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useVaultKeyStore } from "@/store/vault-key-store";
import { MobileNav } from "@/components/layout/mobile-nav";

const NAV_ITEMS = [
  { href: "/vault/passwords", label: "Passwords", icon: KeyRound },
  { href: "/vault/media", label: "Media", icon: ImageIcon },
  { href: "/shared", label: "Shared with me", icon: Share2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  userName,
  userEmail,
}: {
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const lock = useVaultKeyStore((s) => s.lock);

  const handleSignOut = async () => {
    lock();
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0a0c]/90 p-4 backdrop-blur-xl">
        <div className="px-2 py-4">
          <span className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.25)]">
              <KeyRound size={18} strokeWidth={2.2} />
            </span>
            SecureVault
          </span>
        </div>

        <nav className="mt-4 flex-1 space-y-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.18)]"
                    : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon
                  size={17}
                  strokeWidth={active ? 2.4 : 2}
                  className={
                    active ? "text-black" : "text-neutral-500 transition-colors group-hover:text-white"
                  }
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-white ring-1 ring-white/10">
              {(userName ?? userEmail ?? "?")[0]!.toUpperCase()}
            </div>
            <div className="min-w-0 text-xs">
              {userName ? <div className="truncate font-medium text-white">{userName}</div> : null}
              <div className="truncate text-neutral-500">{userEmail}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile floating pill nav (bottom) */}
      <MobileNav />
    </>
  );
}