"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonitorPlay, LayoutDashboard, MonitorSmartphone, Users, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Cihazlar", icon: MonitorSmartphone, path: "/devices" },
  { name: "Teknisyenler", icon: Users, path: "/technicians" },
  { name: "Ayarlar", icon: Settings, path: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-blue-600/20">
          <MonitorPlay className="w-5 h-5 text-white" />
        </div>
        <span className="text-slate-900 font-bold tracking-tight text-lg">RD Portalı</span>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        <div className="px-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Menü
        </div>
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => {
            useAppStore.getState().logout();
          }}
          className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <LogOut className="w-5 h-5 mr-3 text-slate-400 group-hover:text-red-500" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
