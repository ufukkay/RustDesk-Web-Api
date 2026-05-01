"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Monitor, Users, Settings, Wifi } from "lucide-react";

const navItems = [
  { href: "/dashboard",    label: "Genel Bakış",   icon: LayoutDashboard },
  { href: "/devices",      label: "Cihazlar",      icon: Monitor },
  { href: "/technicians",  label: "Teknisyenler",  icon: Users },
  { href: "/settings",     label: "Ayarlar",       icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
          <Wifi className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-slate-900 font-bold text-sm leading-none">RD Portal</p>
          <p className="text-slate-400 text-[10px] mt-0.5">Teknisyen Paneli</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Menü</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400 text-xs">Sistem Aktif</span>
        </div>
      </div>
    </aside>
  );
}
