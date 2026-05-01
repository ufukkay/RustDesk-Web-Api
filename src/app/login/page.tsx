"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { User, Lock, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAppStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simüle giriş (normalde API'ye gider)
    setTimeout(() => {
      login(username);
      router.push("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white selection:bg-brand-yellow selection:text-brand-ink">
      {/* Left: Brand Panel */}
      <div className="relative hidden lg:flex flex-col bg-brand-yellow p-16 overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-ink rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-ink rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-brand-lg shadow-brand flex items-center justify-center font-black text-brand-ink text-3xl tracking-tighter ring-1 ring-brand-ink/5">
              T
            </div>
            <div>
              <p className="text-2xl font-black text-brand-ink tracking-tight">RustDesk Portal</p>
              <p className="text-sm font-bold text-brand-ink/60 uppercase tracking-wider">Uzaktan Destek Sistemi</p>
            </div>
          </div>

          {/* Pitch */}
          <div className="my-auto max-w-md">
            <h1 className="text-5xl font-black text-brand-ink leading-[1.1] tracking-tighter mb-8">
              Cihazlarınızı tek bir yerden yönetin.
            </h1>
            <p className="text-lg font-bold text-brand-ink/70 leading-relaxed mb-10">
              RustDesk yönetim ekibi için uzaktan destek, cihaz envanteri ve teknisyen yetkilendirmesi.
            </p>

            <ul className="space-y-4">
              {[
                "Tek tıkla hızlı bağlantı",
                "Anlık çevrimiçi cihaz takibi",
                "Rol tabanlı teknisyen yetkileri"
              ].map((t, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-ink text-brand-yellow flex items-center justify-center shrink-0 shadow-brand-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="font-black text-brand-ink text-[15px]">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-sm font-black text-brand-ink/40 uppercase tracking-widest mt-auto">
            © 2026 RustDesk Portal · Tüm hakları saklıdır
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-16">
        <div className="w-full max-w-sm space-y-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-brand-ink tracking-tight">Hoş geldiniz</h2>
            <p className="text-slate-400 font-bold text-[14px]">Hesabınıza giriş yaparak panele erişin.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[12px] font-black text-brand-ink uppercase tracking-wide">Kullanıcı Adı</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-300 group-focus-within:text-brand-ink transition-colors" />
                  <Input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 pl-12 bg-slate-50 border-brand-ink/5 rounded-brand focus-visible:ring-brand-yellow focus-visible:bg-white transition-all font-bold text-brand-ink"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-black text-brand-ink uppercase tracking-wide">Şifre</label>
                  <button type="button" className="text-[12px] font-black text-slate-400 hover:text-brand-ink transition-colors">Şifremi unuttum</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-300 group-focus-within:text-brand-ink transition-colors" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-12 bg-slate-50 border-brand-ink/5 rounded-brand focus-visible:ring-brand-yellow focus-visible:bg-white transition-all font-bold text-brand-ink"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer group w-fit">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-ink focus:ring-brand-yellow" defaultChecked />
              <span className="text-[13px] font-bold text-slate-500 group-hover:text-brand-ink transition-colors">Beni hatırla</span>
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90 font-black rounded-brand shadow-brand-sm text-[15px] group ring-1 ring-brand-ink/10"
            >
              {loading ? (
                "Giriş yapılıyor..."
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight className="w-4.5 h-4.5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-widest pt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Güvenli bağlantı · 2FA Destekli
          </div>
        </div>
      </div>
    </div>
  );
}
