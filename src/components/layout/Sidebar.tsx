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
    <aside className="rd2-sidebar w-60">
      {/* Brand */}
      <div className="rd2-brand">
        <div className="w-8.5 h-8.5 rounded-[9px] bg-brand-yellow text-brand-ink flex items-center justify-center font-black text-[11px] tracking-tight shadow-inner shrink-0">
          RD
        </div>
        <div>
          <div className="font-extrabold text-[14px] tracking-tight leading-tight">RustDesk Portal</div>
          <div className="text-[10px] text-muted-foreground font-semibold mt-0.5 opacity-70">Uzaktan Destek Yönetimi</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="rd2-nav flex-1 mt-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`rd2-nav-btn ${active ? "on" : ""}`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-50" />}
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
