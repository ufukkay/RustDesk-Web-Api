"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated && pathname !== "/login" && pathname !== "/invite") {
      router.push("/login");
    } else if (isAuthenticated && pathname === "/login") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, pathname, router, mounted]);

  if (!mounted) {
    return <div className="min-h-screen bg-black flex items-center justify-center">Yükleniyor...</div>;
  }

  // Giriş yapmamışsa ve sayfa login veya davet değilse hiçbir şey gösterme (zaten yönlenecek)
  if (!isAuthenticated && pathname !== "/login" && pathname !== "/invite") {
    return null; 
  }

  return <>{children}</>;
}
