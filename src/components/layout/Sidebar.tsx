"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonitorPlay, LayoutDashboard, MonitorSmartphone, Users, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Cihazlar", icon: MonitorSmartphone, path: "/devices" },
  { name: "Teknisyenler", icon: Users, path: "/technicians" },
  { name: "Ayarlar", icon: Settings, path: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <MonitorPlay className="w-6 h-6 text-primary mr-3" />
        <span className="text-white font-bold tracking-wider">RD PORTAL</span>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Ana Menü
        </div>
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-gray-500 group-hover:text-gray-300")} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10">
        <Link
          href="/login"
          className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Çıkış Yap
        </Link>
      </div>
    </div>
  );
}
