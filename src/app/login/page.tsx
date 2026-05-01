"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wifi, Lock, User, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Kullanıcı adı ve şifre gereklidir.");
      return;
    }
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      login(username);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Soft background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-100" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-200">
            <Wifi className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">RD Portal</h1>
          <p className="text-slate-500 text-sm mt-1">RustDesk Teknisyen Paneli</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Hesabınıza giriş yapın</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Kullanıcı Adı</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 h-10 bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500 rounded-lg"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700">Şifre</label>
                <a href="#" className="text-xs text-blue-600 hover:underline font-medium">Unuttum?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500 rounded-lg"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm shadow-blue-200 transition-all mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Giriş yapılıyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Giriş Yap <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2025 RD Portal · Tüm hakları saklıdır
        </p>
      </div>
    </div>
  );
}
