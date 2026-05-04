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
    <header className="rd2-topbar">
      <div>
        <h1 className="rd2-h1">{getTitle()}</h1>
        <p className="rd2-sub">Hoş geldin, {user?.name?.split(" ")[0] || "Ufuk"}</p>
      </div>

      <div className="rd2-top-r">
        {/* Search */}
        <div className="rd2-search">
          <Search width="14" height="14" />
          <input placeholder="Ara..." />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rd2-icon-btn"
        >
          {theme === "dark" ? <Sun width="17" height="17" style={{ color: "#FFCC00" }} /> : <Moon width="17" height="17" />}
        </button>

        {/* Notifications */}
        <button className="rd2-icon-btn" style={{ position: "relative" }}>
          <Bell width="17" height="17" />
          <span style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#FFCC00", border: "2px solid #fff" }} />
        </button>

        {/* User Dropdown */}
        <div className="rd2-user-pill" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="rd2-user-btn"
          >
            <div className="rd2-avatar" style={{ background: "#FFCC00", color: "#0E1116" }}>
              {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "UK"}
            </div>
            <div className="rd2-uname">{user?.name || "Ufuk Kaya"}</div>
            <ChevronDown width="13" height="13" style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>

          {menuOpen && (
            <div className="rd2-dropdown">
              <div className="rd2-dd-head">
                <div className="rd2-dd-name">{user?.name || "Ufuk Kaya"}</div>
                <div className="rd2-dd-email">{user?.email || "admin@rustdesk.local"}</div>
              </div>
              <div className="rd2-dd-body">
                <button className="rd2-dd-item">
                  <UserIcon width="14" height="14" />
                  Profil Bilgilerim
                </button>
              </div>
              <div className="rd2-dd-foot">
                <button
                  onClick={() => logout()}
                  className="rd2-dd-item rd2-dd-danger"
                >
                  <LogOut width="14" height="14" />
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
