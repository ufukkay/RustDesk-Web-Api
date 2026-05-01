"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Monitor, Users, Settings, Bell, Search, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

const navItems = [
  { href: "/dashboard",   label: "Genel Bakış",  icon: LayoutDashboard },
  { href: "/devices",     label: "Cihazlar",     icon: Monitor },
  { href: "/technicians", label: "Teknisyenler", icon: Users },
  { href: "/settings",    label: "Ayarlar",      icon: Settings },
];

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-brand-ink/5 flex items-center px-8 gap-8 sticky top-0 z-30 w-full backdrop-blur-md">
      {/* Logo: Talay "T" Mark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 bg-brand-yellow rounded-[9px] flex items-center justify-center shadow-brand-sm font-black text-brand-ink text-lg tracking-tighter ring-1 ring-brand-ink/10 inset-shadow-sm">
          T
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-extrabold text-brand-ink text-sm tracking-tight">Talay Portal</span>
          <span className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-wide uppercase">RustDesk Admin</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-brand font-bold text-[13px] transition-all duration-150 ${
                active
                  ? "bg-brand-yellow text-brand-ink shadow-brand-sm"
                  : "text-slate-500 hover:text-brand-ink hover:bg-brand-ink/5"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-brand-ink" : "text-slate-400"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Search — pushes to right */}
      <div className="relative ml-auto hidden lg:block w-72">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Cihaz veya kullanıcı ara…"
          className="pl-10 h-10 bg-white border-brand-ink/10 text-brand-ink text-sm rounded-brand focus-visible:ring-brand-yellow shadow-brand-sm"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 pointer-events-none">
          ⌘K
        </kbd>
      </div>

      {/* User menu & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="relative w-10 h-10 flex items-center justify-center rounded-brand border border-brand-ink/10 hover:bg-brand-ink/5 text-slate-500 hover:text-brand-ink transition-colors shrink-0">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-3 right-3 w-2 h-2 bg-brand-yellow rounded-full ring-2 ring-white" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-brand-ink/10 hover:bg-brand-ink/5 transition-colors bg-white shadow-brand-sm"
          >
            <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center text-brand-ink font-black text-xs shrink-0 ring-1 ring-brand-ink/10">
              {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "UK"}
            </div>
            <div className="hidden sm:block text-left leading-none">
              <p className="text-[13px] font-extrabold text-brand-ink">{user?.name || "Ufuk Kaya"}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{user?.role || "Yönetici"}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-brand-ink/10 rounded-brand-lg shadow-brand overflow-hidden z-50">
              <div className="px-5 py-4 bg-brand-bg/50 border-b border-brand-ink/5">
                <p className="text-sm font-black text-brand-ink">{user?.name || "Ufuk Kaya"}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{user?.email || "ufuk@talay.com"}</p>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-brand text-[13px] text-slate-600 hover:bg-brand-ink/5 hover:text-brand-ink transition-colors font-bold">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Profil Bilgilerim
                </button>
              </div>
              <div className="p-2 border-t border-brand-ink/5">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-brand text-[13px] text-red-600 hover:bg-red-50 transition-colors font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
