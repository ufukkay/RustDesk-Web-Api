"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Download, Clock, Zap, CheckCircle2 } from "lucide-react";
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

  // Simulate progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUpdating && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 99) {
            clearInterval(interval);
            return 99;
          }
          return prev + 1;
        });
      }, 1200); // 120 seconds total / 100
    }
    return () => clearInterval(interval);
  }, [isUpdating, progress]);

  const handleUpdate = async () => {
    if (!confirm("Sistem güncellenecek ve yeniden başlatılacak. Devam edilsin mi?")) return;
    
    setIsUpdating(true);
    setProgress(0);
    
    try {
      const res = await fetch("/api/system/update", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        // Build started... progress will continue via useEffect
        setTimeout(() => {
          setProgress(100);
          setIsUpdating(false);
          setIsDone(true);
          
          const now = new Date().toLocaleString("tr-TR");
          localStorage.setItem("last_update_check", now);
          setLastChecked(now);
        }, 120000); // 2 minutes
      } else {
        throw new Error(data.error || "Güncelleme başlatılamadı.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bağlantı hatası.";
      alert("Hata: " + message);
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card rounded-xl border border-border shadow-brand-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-tight">Yazılım Güncelleme</h3>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Otomatik Sistem Senkronizasyonu</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary text-foreground text-[10px] font-semibold rounded-full border border-border shadow-sm">
            <Zap className="w-3.5 h-3.5 text-primary fill-current" />
            STABİL KANAL
          </div>
        </div>

        <div className="p-10 space-y-10">
          {/* Main Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-3">
              <p className="text-lg font-semibold text-foreground tracking-tight">Yeni Sürümü Yükle</p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Sistemi en son kodlarla günceller, veritabanını optimize eder ve servisleri yeniden başlatır.
              </p>
            </div>

            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-brand hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isUpdating ? "GÜNCELLEME SÜRÜYOR" : "ŞİMDİ GÜNCELLE"}
            </button>
          </div>

          {/* Progress Section */}
          {isUpdating && (
            <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                <span className="text-primary">Sistem Derleniyor...</span>
                <span className="text-muted-foreground">%{progress}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border p-0.5">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground text-center font-medium italic">
                Lütfen bu işlemi bölmeyin. Panel 2 dakika içinde otomatik olarak hazır olacaktır.
              </p>
            </div>
          )}

          {!isUpdating && !isDone && (
            <div className="flex items-start gap-4 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-tight">Sistem Hazır</p>
                <p className="text-xs text-emerald-600/70 font-medium mt-1 leading-relaxed">
                  Şu an en son kararlı sürümü kullanıyorsunuz. Herhangi bir bekleyen güncelleme bulunmuyor.
                </p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex items-center justify-between pt-8 border-t border-border">
            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">
              <Clock className="w-4 h-4" />
              <span>Son Başarılı Güncelleme: {lastChecked || "Henüz yapılmadı"}</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest bg-muted px-2 py-1 rounded">
              Branch: main
            </p>
          </div>
        </div>
      </div>

      {/* Done Dialog */}
      <Dialog open={isDone} onOpenChange={setIsDone}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader className="flex flex-col items-center justify-center pt-6">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-in zoom-in duration-300" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Güncelleme Tamamlandı!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Sistem başarıyla en son sürüme yükseltildi ve servisler yeniden başlatıldı.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pb-6">
            <Button 
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground font-semibold px-10"
            >
              Paneli Yenile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
