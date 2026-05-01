"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Monitor, Users, Settings, Wifi, Bell, Search, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
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
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-6 sticky top-0 z-30 w-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
          <Wifi className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-slate-900 text-sm">RD Portal</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-200 shrink-0" />

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Search — pushes to right */}
      <div className="relative ml-auto hidden md:block w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          placeholder="Cihaz ara..."
          className="pl-8 h-8 bg-slate-50 border-slate-200 text-slate-800 text-sm rounded-lg focus-visible:ring-blue-500"
        />
      </div>

      {/* Bell */}
      <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors shrink-0">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
      </button>

      {/* User menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold text-slate-700 hidden sm:block">{user?.name || "Admin"}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-900">{user?.name || "Admin"}</p>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email || "admin@firma.com"}</p>
            </div>
            <div className="p-1.5">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium">
                <UserIcon className="w-4 h-4 text-slate-400" />
                Profil Bilgilerim
              </button>
            </div>
            <div className="p-1.5 border-t border-slate-100">
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Çıkış Yap
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
