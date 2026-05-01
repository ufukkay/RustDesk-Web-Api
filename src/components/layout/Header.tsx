"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";

export function Header() {
  const { user, logout } = useAppStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center flex-1">
        <Button variant="ghost" size="icon" className="md:hidden mr-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
          <Menu className="w-5 h-5" />
        </Button>
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cihaz ID veya isim ara..." 
            className="pl-9 bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500 h-9 rounded-full shadow-inner"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-blue-600 rounded-full animate-pulse ring-2 ring-white" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
              <Avatar className="h-9 w-9 border border-slate-200 shadow-sm">
                <AvatarImage src="https://github.com/shadcn.png" alt="@admin" />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{(user?.name || "AD").substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border-slate-200 text-slate-700 shadow-lg" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none text-slate-900">{user?.name || "Admin Kullanıcısı"}</p>
                <p className="text-xs leading-none text-slate-500">{user?.email || "admin@rustdesk.local"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer font-medium">
              Profil Ayarları
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer font-medium">
              Sistem Tercihleri
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem 
              className="focus:bg-red-50 focus:text-red-600 text-red-600 cursor-pointer font-medium"
              onClick={() => logout()}
            >
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
