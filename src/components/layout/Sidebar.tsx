"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Monitor, Users, Settings, Package, ChevronRight } from "lucide-react";

const navItems = [
  { href: "/dashboard",    label: "Genel Bakış",   icon: LayoutDashboard },
  { href: "/devices",      label: "Cihazlar",      icon: Monitor },
  { href: "/builder",      label: "Paket Oluşturucu", icon: Package },
  { href: "/technicians",  label: "Teknisyenler",  icon: Users },
  { href: "/settings",     label: "Ayarlar",       icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="rd2-sidebar">
      <div className="rd2-brand">
        <div style={{
          width: 34, height: 34, borderRadius: 34 * 0.28,
          background: "#FFCC00", color: "#0E1116",
          display: "grid", placeItems: "center",
          fontWeight: 900, fontSize: 34 * 0.32,
          letterSpacing: "0.02em", flexShrink: 0,
          boxShadow: `inset 0 -1px 0 #0E111618`,
        }}>RD</div>
        <div>
          <div className="rd2-brand-name">RustDesk Portal</div>
          <div className="rd2-brand-sub">Uzaktan Destek Yönetimi</div>
        </div>
      </div>

      <nav className="rd2-nav">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`rd2-nav-btn ${active ? "on" : ""}`}
              style={active ? { background: "#FFCC00", color: "#0E1116" } : {}}
            >
              <Icon width="17" height="17" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="rd2-sidebar-foot">
        <span className="rd2-dot rd2-dot-green" />
        <span>Sistem Aktif</span>
      </div>
    </aside>
  );
}
