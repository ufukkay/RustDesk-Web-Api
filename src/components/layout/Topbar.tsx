"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Monitor, Users, Settings, Bell, Search, LogOut, User as UserIcon, ChevronDown, Moon, Sun, Package } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";

const navItems = [
  { href: "/dashboard",   label: "Genel Bakış",  icon: LayoutDashboard },
  { href: "/devices",     label: "Cihazlar",     icon: Monitor },
  { href: "/builder",     label: "Paket Oluşturucu", icon: Package },
  { href: "/technicians", label: "Teknisyenler", icon: Users },
  { href: "/settings",    label: "Ayarlar",      icon: Settings },
];

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

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
    <header className="h-16 border-b border-border bg-white dark:bg-card sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-brand-yellow rounded-lg flex items-center justify-center text-brand-ink font-black text-lg">
            R
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-[14px] tracking-tight">RustDesk Portal</span>
              <div className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-black tracking-widest leading-none uppercase">Canlı</div>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">Yönetim Paneli</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  isActive 
                    ? "bg-brand-yellow/10 text-brand-ink dark:text-brand-yellow" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-brand-ink dark:text-brand-yellow" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User actions */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-border hover:bg-secondary text-muted-foreground hover:text-brand-yellow transition-all duration-300 hover:rotate-12 active:scale-90 bg-card shadow-sm group"
              aria-label="Koyu/Aydınlık Mod"
            >
              {mounted && (
                theme === "dark" 
                  ? <Sun className="w-5 h-5 transition-all group-hover:scale-110" /> 
                  : <Moon className="w-5 h-5 transition-all group-hover:scale-110" />
              )}
            </button>

            <button className="relative w-10 h-10 flex items-center justify-center rounded-full border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0 bg-card shadow-sm">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-yellow rounded-full ring-2 ring-white dark:ring-card" />
            </button>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-border hover:bg-secondary transition-colors bg-white dark:bg-card shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center text-brand-ink font-black text-xs shrink-0 ring-1 ring-border">
                {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "UK"}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <p className="text-[13px] font-semibold text-foreground">{user?.name || "Ufuk Kaya"}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">{user?.role || "Yönetici"}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-brand overflow-hidden z-50">
                <div className="px-5 py-4 bg-muted/30 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">{user?.name || "Ufuk Kaya"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user?.email || "admin@rustdesk.local"}</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors font-medium">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    Profil Bilgilerim
                  </button>
                </div>
                <div className="p-2 border-t border-border">
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-destructive hover:bg-destructive/10 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
