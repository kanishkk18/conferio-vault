"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, ScrollText, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/audit-logs", label: "Audit logs", icon: ScrollText },
];

export function AdminSidebar({
  userName,
  userEmail,
}: {
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-border bg-surface p-4">
      <div className="px-2 py-3">
        <span className="text-lg font-semibold">🔒 SecureVault</span>
        <div className="text-xs text-muted">Admin</div>
      </div>

      <nav className="mt-4 flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-3 space-y-2">
        <div className="px-2 text-xs text-muted truncate">
          {userName ? <div className="text-foreground">{userName}</div> : null}
          <div className="truncate">{userEmail}</div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-hover hover:text-danger transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
