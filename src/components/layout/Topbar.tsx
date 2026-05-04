"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, LogOut, User as UserIcon, ChevronDown, Moon, Sun } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Get title based on pathname
  const getTitle = () => {
    if (pathname === "/dashboard") return "Genel Bakış";
    if (pathname === "/devices") return "Cihazlar";
    if (pathname === "/builder") return "Paket Oluşturucu";
    if (pathname === "/technicians") return "Teknisyenler";
    if (pathname === "/settings") return "Ayarlar";
    if (pathname.startsWith("/devices/")) return "Cihaz Detayı";
    return "RustDesk Portal";
  };

  useEffect(() => {
    setMounted(true);
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!mounted) return <header className="rd2-topbar h-16" />;

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-[#F7F7F5]/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-20 rd2-topbar">
      <div>
        <h1 className="text-[20px] font-black tracking-tight rd2-h1">{getTitle()}</h1>
        <p className="text-[12px] text-[#5C6573] mt-0.5 rd2-sub">Hoş geldin, {user?.name?.split(" ")[0] || "Ufuk"}</p>
      </div>

      <div className="rd2-top-r">
        {/* Search */}
        <div className="rd2-search hidden lg:flex">
          <Search className="w-4 h-4" />
          <input placeholder="Ara..." />
          <kbd className="hidden sm:inline-block">⌘K</kbd>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rd2-icon-btn"
        >
          {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-brand-yellow" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications */}
        <button className="rd2-icon-btn relative">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-yellow rounded-full ring-2 ring-white" />
        </button>

        {/* User Dropdown */}
        <div className="rd2-user-pill" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="rd2-user-btn"
          >
            <div className="rd2-avatar bg-brand-yellow text-brand-ink">
              {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "UK"}
            </div>
            <div className="rd2-uname">{user?.name || "Ufuk Kaya"}</div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="rd2-dropdown">
              <div className="rd2-dd-head">
                <div className="rd2-dd-name">{user?.name || "Ufuk Kaya"}</div>
                <div className="rd2-dd-email">{user?.email || "admin@rustdesk.local"}</div>
              </div>
              <div className="rd2-dd-body">
                <button className="rd2-dd-item">
                  <UserIcon className="w-4 h-4" />
                  Profil Bilgilerim
                </button>
              </div>
              <div className="rd2-dd-foot">
                <button
                  onClick={() => logout()}
                  className="rd2-dd-item rd2-dd-danger"
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
