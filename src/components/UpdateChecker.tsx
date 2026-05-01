"use client";

import { useState } from "react";
import { Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export function UpdateChecker() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleUpdate = async () => {
    if (!confirm("Sistem güncellenecektir. Onaylıyor musunuz?")) return;
    
    setLoading(true);
    setStatus("idle");
    
    try {
      const res = await fetch("/api/system/update", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setStatus("success");
        // 3 saniye sonra sayfayı otomatik yenile
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
          <h2 className="text-2xl font-black text-foreground uppercase">Sistem Güncelleme</h2>
          <p className="text-sm text-muted-foreground">Tek tıkla en son sürümü GitHub üzerinden çekip yükleyin.</p>
        </div>

        <div className="flex flex-col items-center gap-6 py-4">
          {status === "idle" && (
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full max-w-sm h-16 bg-primary text-primary-foreground font-black text-lg rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
              {loading ? "GÜNCELLENİYOR..." : "ŞİMDİ GÜNCELLE"}
            </button>
          )}

          {status === "success" && (
            <div className="w-full p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-xl text-center space-y-4 animate-in zoom-in-95">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-lg font-bold text-emerald-600">Güncelleme Başlatıldı!</p>
                <p className="text-sm text-emerald-600/80">Sistem arka planda derleniyor. Yaklaşık 1 dakika sonra bu sayfayı yenileyebilirsiniz.</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors"
              >
                SAYFAYI YENİLE
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="w-full p-6 bg-destructive/10 border-2 border-destructive/20 rounded-xl text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="font-bold text-destructive">Bir hata oluştu. Lütfen terminalden kontrol edin.</p>
              <button onClick={() => setStatus("idle")} className="text-sm underline font-bold">Tekrar Dene</button>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Sistem Çalışıyor
        </div>
      </div>
    </div>
  );
}
