"use client";

import { useState } from "react";
import { Download, RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";

export function UpdateChecker() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error" | "no-update">("idle");

  const handleUpdate = async () => {
    if (!confirm("Güncelleme kontrolü başlatılacak. Onaylıyor musunuz?")) return;
    
    setLoading(true);
    setStatus("idle");
    
    try {
      // 1. Önce güncelleme var mı kontrol et
      const checkRes = await fetch("/api/system/update/check");
      const checkData = await checkRes.json();
      
      if (!checkData.hasUpdate) {
        setStatus("no-update");
        setLoading(false);
        return;
      }

      // 2. Güncelleme varsa başlat
      const res = await fetch("/api/system/update", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setStatus("success");
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error(data.error || "Güncelleme başlatılamadı.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in duration-500">
      <div className="bg-card rounded-2xl border-2 border-border p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Sistem Güncelleme</h2>
          <p className="text-sm text-muted-foreground font-medium">Sistem sürümünü GitHub ile senkronize edin.</p>
        </div>

        <div className="flex flex-col items-center gap-6 py-4">
          {(status === "idle" || status === "no-update") && (
            <div className="w-full space-y-4 flex flex-col items-center">
              {status === "no-update" && (
                <div className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 text-blue-600 animate-in slide-in-from-top-2">
                  <Info className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold uppercase tracking-tight">Harika! Sisteminiz şu an en güncel sürümde.</p>
                </div>
              )}
              
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="w-full max-w-sm h-16 bg-primary text-primary-foreground font-black text-lg rounded-xl shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                {loading ? "KONTROL EDİLİYOR..." : "GÜNCELLEMELERİ DENETLE"}
              </button>
            </div>
          )}

          {status === "success" && (
            <div className="w-full p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-xl text-center space-y-4 animate-in zoom-in-95">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-lg font-bold text-emerald-600">Güncelleme Başlatıldı!</p>
                <p className="text-sm text-emerald-600/80">Yeni kodlar çekildi. Sayfa 3 saniye içinde otomatik yenilenecektir.</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="w-full p-6 bg-destructive/10 border-2 border-destructive/20 rounded-xl text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="font-bold text-destructive uppercase tracking-tight">Bağlantı Hatası veya Git Çakışması!</p>
              <button onClick={() => setStatus("idle")} className="text-sm underline font-black uppercase">Tekrar Dene</button>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          Bulut Sunucu Bağlantısı Aktif
        </div>
      </div>
    </div>
  );
}
