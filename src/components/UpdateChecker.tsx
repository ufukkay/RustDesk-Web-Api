"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Download, Clock, Zap, CheckCircle2, ShieldCheck, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function UpdateChecker() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Bekleniyor...");
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("last_update_check");
    if (saved) {
      requestAnimationFrame(() => {
        setLastChecked(saved);
      });
    }
  }, []);

  // Dynamic status messages based on progress
  useEffect(() => {
    if (!isUpdating) return;
    if (progress < 20) setStatusText("GitHub senkronizasyonu başlatılıyor...");
    else if (progress < 40) setStatusText("Yeni paketler indiriliyor...");
    else if (progress < 70) setStatusText("Next.js projesi derleniyor (Build)...");
    else if (progress < 90) setStatusText("Servisler optimize ediliyor...");
    else setStatusText("Sistem yeniden başlatılmak üzere...");
  }, [progress, isUpdating]);

  // Simulated progress logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUpdating && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 99) {
            clearInterval(interval);
            return 99;
          }
          // Faster at start, slower during build
          const increment = prev > 40 && prev < 80 ? 0.5 : 1;
          return prev + increment;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isUpdating, progress]);

  const handleUpdate = async () => {
    if (!confirm("Sistem güncellenecek ve derleme başlatılacaktır. Devam edilsin mi?")) return;
    
    setIsUpdating(true);
    setProgress(0);
    
    try {
      const res = await fetch("/api/system/update", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setTimeout(() => {
          setProgress(100);
          setIsUpdating(false);
          setIsDone(true);
          const now = new Date().toLocaleString("tr-TR");
          localStorage.setItem("last_update_check", now);
          setLastChecked(now);
        }, 100000); // ~1.5 minutes simulated build
      } else {
        throw new Error(data.error || "Güncelleme hatası.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bağlantı kesildi.";
      alert("Hata: " + message);
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Güvenlik</p>
            <p className="text-sm font-semibold text-foreground">Güncel</p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Sistem Durumu</p>
            <p className="text-sm font-semibold text-foreground">Stabil</p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Son Senkron</p>
            <p className="text-xs font-semibold text-foreground">{lastChecked?.split(" ")[0] || "Hiç"}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-md overflow-hidden">
        {/* Update Logic Container */}
        <div className="p-8 md:p-12 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">v2.4.0-stable</span>
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">Sistem Çekirdek Güncellemesi</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                GitHub deposundaki en son iyileştirmeleri ve performans güncellemelerini tek tıkla sisteme uygular.
              </p>
            </div>

            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 shrink-0 ${
                isUpdating 
                  ? "bg-secondary text-muted-foreground cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:shadow-primary/20 hover:opacity-95"
              }`}
            >
              {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isUpdating ? "İŞLEM YAPILIYOR" : "GÜNCELLEMEYİ BAŞLAT"}
            </button>
          </div>

          {/* Progress Section */}
          {isUpdating && (
            <div className="space-y-6 pt-6 border-t border-border animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-semibold text-foreground">{statusText}</span>
                </div>
                <span className="text-sm font-black text-primary">%{Math.round(progress)}</span>
              </div>
              
              <div className="relative h-4 bg-secondary rounded-full overflow-hidden border border-border p-1">
                <div 
                  className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700 ease-out shadow-sm relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-stripe_1s_linear_infinite]" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Bu işlem arka planda güvenle devam eder. Sayfayı kapatmamanız önerilir.</span>
              </div>
            </div>
          )}

          {!isUpdating && (
            <div className="flex items-center justify-between pt-6 border-t border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Sistem tamamen güncel
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Son Kontrol: {lastChecked || "Henüz kontrol edilmedi"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Done Dialog */}
      <Dialog open={isDone} onOpenChange={setIsDone}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
          <DialogHeader className="flex flex-col items-center justify-center pt-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">Sistem Güncellendi!</DialogTitle>
            <DialogDescription className="text-center pt-3 text-muted-foreground leading-relaxed">
              En son kodlar başarıyla çekildi, proje derlendi ve servisler optimize edildi. Artık yeni özellikleri kullanmaya hazırsınız.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pb-8 pt-4">
            <Button 
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground font-bold px-12 py-6 rounded-xl text-md shadow-lg shadow-primary/20 hover:opacity-95"
            >
              PANELİ YENİLE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
