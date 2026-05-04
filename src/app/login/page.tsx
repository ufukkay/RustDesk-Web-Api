"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { User, Lock, ArrowRight, ShieldCheck, Check, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@rustdesk.local");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAppStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email);
      router.push("/dashboard");
    }, 800);
  };

  return (
    <div className="rd2-login">
      {/* Left brand panel */}
      <div className="rd2-login-left bg-brand-yellow">
        <div className="rd2-ll-inner">
          <div className="rd2-ll-logo">
            <div className="w-13 h-13 bg-white rounded-[14px] flex items-center justify-center font-black text-brand-ink text-2xl tracking-tighter shadow-sm">RD</div>
            <div>
              <div className="text-[20px] font-black text-brand-ink tracking-tight">RustDesk Portal</div>
              <div className="text-[12px] text-brand-ink opacity-65 mt-0.5 uppercase tracking-widest font-bold">Uzaktan Destek</div>
            </div>
          </div>
          <div className="rd2-ll-pitch">
            <h2>Tüm cihazlarınız,<br/>tek panelden.</h2>
            <p>RustDesk altyapısı üzerinde uzaktan destek, cihaz envanteri, terminal ve teknisyen yönetimi.</p>
            <ul>
              {["Tek tıkla uzak bağlantı", "Anlık cihaz durumu izleme", "Uzak terminal & komut", "Rol tabanlı erişim"].map((s, i) => (
                <li key={i}>
                  <span className="rd2-tick bg-brand-ink text-brand-yellow">
                    <Check width="10" height="10" />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rd2-ll-foot">© 2026 RustDesk Portal</div>
        </div>
      </div>

      {/* Right form */}
      <div className="rd2-login-right">
        <form className="rd2-login-form" onSubmit={handleSubmit}>
          <div className="rd2-lf-head">
            <h3>Hoş geldiniz</h3>
            <p>Hesabınıza giriş yapın.</p>
          </div>
          
          <div className="rd2-field-group">
            <label>E-posta Adresi</label>
            <div className="rd2-field">
              <Mail width="15" height="15" className="opacity-40" />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="admin@rustdesk.local" 
                required 
              />
            </div>
          </div>

          <div className="rd2-field-group">
            <div className="rd2-field-row-label">
              <label>Şifre</label>
              <button type="button" className="rd2-link-sm">Unuttum?</button>
            </div>
            <div className="rd2-field">
              <Lock width="15" height="15" className="opacity-40" />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>

          <label className="rd2-checkbox">
            <input type="checkbox" defaultChecked />
            <span>Beni hatırla</span>
          </label>

          <button 
            type="submit" 
            className="rd2-btn-primary-full bg-brand-yellow text-brand-ink" 
            disabled={loading}
          >
            {loading ? "Giriş yapılıyor…" : (
              <>
                <span>Giriş Yap</span>
                <ArrowRight width="16" height="16" />
              </>
            )}
          </button>

          <div className="rd2-lf-foot">
            <ShieldCheck width="13" height="13" className="text-emerald-500" /> 
            Güvenli bağlantı · 2FA Destekli
          </div>
        </form>
      </div>
    </div>
  );
}
