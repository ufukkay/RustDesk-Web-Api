"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Download, Clock, Zap, CheckCircle2 } from "lucide-react";

export function UpdateChecker() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("last_update_check");
    if (saved) setLastChecked(saved);
  }, []);

  const handleUpdate = async () => {
    if (!confirm("En son kodlar GitHub'dan çekilecek ve sistem yeniden derlenecektir. Devam edilsin mi?")) return;
    
    setIsUpdating(true);
    setUpdateMsg("GitHub bağlantısı kuruluyor, kodlar senkronize ediliyor...");
    
    try {
      const res = await fetch("/api/system/update", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        const now = new Date().toLocaleString("tr-TR");
        localStorage.setItem("last_update_check", now);
        setLastChecked(now);
        setUpdateMsg("Kodlar başarıyla çekildi! Derleme yapılıyor, panel 2 dakika içinde hazır olacak...");
        
        // Sayfayı 2 dakika sonra yenile
        setTimeout(() => window.location.reload(), 120000);
      } else {
        throw new Error(data.error || "Güncelleme başlatılamadı.");
      }
    } catch (e: any) {
      alert("Hata: " + e.message);
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-card rounded-brand-lg border border-brand-ink/5 dark:border-white/5 shadow-brand-sm overflow-hidden animate-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-brand-ink/5 dark:border-white/5 bg-brand-bg/10 dark:bg-white/5 flex items-center justify-between">
        <div>
          <h3 className="font-black text-brand-ink dark:text-white text-sm uppercase tracking-tight">Sistem Bakımı</h3>
          <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">GitHub Senkronizasyonu</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-black bg-brand-yellow text-brand-ink px-3 py-1.5 rounded-full shadow-brand-sm ring-1 ring-brand-ink/10">
          <Zap className="w-3.5 h-3.5 fill-current" />
          STABİL KANAL
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="text-sm font-black text-brand-ink dark:text-white uppercase tracking-tight">Yazılımı Güncelle</p>
            <p className="text-[12px] text-slate-500 font-medium leading-relaxed max-w-sm">
              Bu buton GitHub'daki en son kodları çeker ve sistemi otomatik olarak derleyip yeniden başlatır.
            </p>
          </div>

          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-brand-yellow text-brand-ink text-[14px] font-black rounded-brand shadow-brand ring-1 ring-brand-ink/10 hover:bg-brand-yellow/90 transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isUpdating ? "GÜNCELLENİYOR..." : "ŞİMDİ GÜNCELLE"}
          </button>
        </div>

        {isUpdating ? (
          <div className="flex items-start gap-4 p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-brand-lg">
            <RefreshCw className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-spin" />
            <div>
              <p className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">Güncelleme Devam Ediyor</p>
              <p className="text-[12px] text-amber-700 dark:text-amber-500 font-bold mt-1 leading-relaxed">
                {updateMsg}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 p-5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-brand-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">Sistem Aktif</p>
              <p className="text-[12px] text-emerald-700 dark:text-emerald-500 font-bold mt-1 leading-relaxed">
                Yazılım şu an en son çekilen kodlarla çalışıyor. İstediğiniz zaman tekrar senkronize edebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="flex items-center justify-between pt-6 border-t border-brand-ink/5 dark:border-white/5">
          <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-bold uppercase tracking-wide">
            <Clock className="w-3.5 h-3.5" />
            <span>Son Güncelleme: {lastChecked || "Henüz yapılmadı"}</span>
          </div>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            Branch: main
          </p>
        </div>
      </div>
    </div>
  );
}
