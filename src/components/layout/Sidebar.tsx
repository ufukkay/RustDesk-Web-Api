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
    <aside className="w-60 bg-white border-r border-black/5 flex flex-col h-screen sticky top-0 shrink-0 rd2-sidebar">
      <div className="flex items-center gap-3 p-2 px-3 pb-6 border-b border-black/[0.03] mb-4 rd2-brand">
        <div className="w-8.5 h-8.5 rounded-[9px] bg-[#FFCC00] text-[#0E1116] flex items-center justify-center font-black text-[11px] tracking-tight shadow-inner shrink-0">
          RD
        </div>
        <div>
          <div className="font-extrabold text-[14px] tracking-tight leading-tight text-[#0E1116]">RustDesk Portal</div>
          <div className="text-[10px] text-[#8B92A0] font-semibold mt-0.5 opacity-70 uppercase tracking-widest">Uzaktan Destek</div>
        </div>
      </div>

      <nav className="flex-1 px-2 flex flex-col gap-1 rd2-nav">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-bold transition-all rd2-nav-btn ${
                active 
                  ? "bg-[#FFCC00] text-[#0E1116] shadow-sm active" 
                  : "text-[#5C6573] hover:bg-[#F1F2F4] hover:text-[#0E1116]"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 flex items-center gap-2 border-t border-black/[0.03] text-[11px] font-bold text-[#8B92A0] rd2-sidebar-foot">
        <span className="w-2 h-2 rounded-full bg-emerald-500 rd2-dot rd2-dot-green" />
        <span>Sistem Aktif</span>
      </div>
    </aside>
  );
}
