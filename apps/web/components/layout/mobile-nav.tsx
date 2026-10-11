"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Image as ImageIcon, User, Plus, KeyRound, FolderUp } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 400);
    return () => clearTimeout(t);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [pathname]);

  const trigger = (eventName: string) => {
    setMenuOpen(false);
    // slight delay so the sheet dismisses smoothly before the modal opens
    setTimeout(() => window.dispatchEvent(new CustomEvent(eventName)), 250);
  };

  const items = [
    { href: "/vault/passwords", icon: Home, active: pathname?.startsWith("/vault/passwords") },
    { href: "/vault/media", icon: ImageIcon, active: pathname?.startsWith("/vault/media") },
    { href: "/settings", icon: User, active: pathname?.startsWith("/settings") },
  ];

  return (
    <>
      {/* Floating pill nav + white plus button */}
      <nav className="fixed inset-x-0 bottom-0 mb-4 z-40 flex items-center justify-center gap-3 md:hidden">
        <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#16161a]/85 p-1.5 shadow-[0_12px_45px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
          {items.map(({ href, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                active
                  ? "bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.3 : 2} />
            </Link>
          ))}
        </div>

        {/* The white "+" button from the image */}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Add new"
          className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-white text-black shadow-[0_0_35px_rgba(255,255,255,0.35)] transition-all duration-200 active:scale-90"
        >
          <Plus size={24} strokeWidth={2.4} />
        </button>
      </nav>

      {/* "+" menu — mini iOS sheet */}
      {mounted && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            onClick={() => setMenuOpen(false)}
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[1.75rem] border-x border-t border-white/10 bg-[#0d0d10] px-5 pb-10 pt-3 shadow-[0_-20px_70px_rgba(0,0,0,0.8)] transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              visible ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <p className="mb-3 px-1 text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              Add new
            </p>
            <div className="space-y-2">
              <button
                onClick={() => trigger("securevault:new-password")}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3.5 text-left transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.07]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black shadow-[0_0_22px_rgba(255,255,255,0.2)]">
                  <KeyRound size={18} strokeWidth={2.2} />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-medium text-white">Password</span>
                  <span className="block text-[12px] text-neutral-500">Save a new login or note</span>
                </span>
              </button>
              <button
                onClick={() => trigger("securevault:new-media")}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3.5 text-left transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.07]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black shadow-[0_0_22px_rgba(255,255,255,0.2)]">
                  <FolderUp size={18} strokeWidth={2.2} />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-medium text-white">Media upload</span>
                  <span className="block text-[12px] text-neutral-500">Encrypted file upload</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}