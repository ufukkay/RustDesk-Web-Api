"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, Clock, Zap, CheckCircle2, ShieldCheck, Activity, GitCommit, Play, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
}

type UpdateStep = "idle" | "downloading" | "ready" | "installing" | "done";

export function UpdateChecker() {
  const [step, setStep] = useState<UpdateStep>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Sistem Hazır");
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(true);

  const fetchCommits = useCallback(async () => {
    try {
      const res = await fetch("https://api.github.com/repos/ufukkay/RustDesk-Web-Api/commits?per_page=3");
      const data = await res.json();
      if (Array.isArray(data)) setCommits(data);
    } catch {
      console.error("Değişiklikler alınamadı.");
    } finally {
      setLoadingCommits(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("last_update_check");
    if (saved) requestAnimationFrame(() => setLastChecked(saved));
    fetchCommits();
  }, [fetchCommits]);

  // Real-time FAST polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    if (step === "installing") {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch("/api/system/update/status");
          const data = await res.json();
          
          if (data.status === "done") {
            setProgress(100);
            setStep("done");
            const now = new Date().toLocaleString("tr-TR");
            localStorage.setItem("last_update_check", now);
            setLastChecked(now);
            clearInterval(pollInterval);
          } else if (data.status === "error") {
            alert("Hata: " + data.message);
            setStep("idle");
            clearInterval(pollInterval);
          }
        } catch (e) {
          console.error("Takip hatası.");
        }
      }, 1000); // Check every 1 second for maximum speed
    }
    return () => clearInterval(pollInterval);
  }, [step]);

  // Fast UI progress (no artificial caps)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "downloading" && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setStep("ready");
            return 100;
          }
          return prev + 10; // Very fast download simulation
        });
      }, 100);
    } else if (step === "installing" && progress < 99) {
      interval = setInterval(() => {
        setProgress(prev => (prev < 99 ? prev + 1 : 99));
      }, 500); // Just a slow crawl to show activity, but will jump to 100% on signal
    }
    return () => clearInterval(interval);
  }, [step, progress]);

  const startDownload = () => {
    setStep("downloading");
    setProgress(0);
    setStatusText("Dosyalar çekiliyor...");
  };

  const startInstall = async () => {
    setStep("installing");
    setProgress(0);
    setStatusText("Sunucuda işlem başlatıldı...");
    try {
      const res = await fetch("/api/system/update", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    } catch (err) {
      alert("Hata: " + (err instanceof Error ? err.message : "Bağlantı Hatası"));
      setStep("idle");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-primary" /></div>
          <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">Güvenlik</p><p className="text-sm font-semibold text-foreground">Aktif</p></div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Activity className="w-5 h-5 text-emerald-500" /></div>
          <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">Sistem</p><p className="text-sm font-semibold text-foreground">Stabil</p></div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><Clock className="w-5 h-5 text-muted-foreground" /></div>
          <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">Son Senkron</p><p className="text-xs font-semibold text-foreground">{lastChecked?.split(" ")[0] || "Hiç"}</p></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-md overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Sürüm Kontrolü</h3>
              <p className="text-sm text-muted-foreground">Sunucuyla gerçek zamanlı senkronizasyon.</p>
            </div>
            
            {step === "idle" && (
              <button
                onClick={startDownload}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-95 transition-all active:scale-95 shrink-0"
              >
                <Download className="w-5 h-5" />
                GÜNCELLEMELERİ ÇEK
              </button>
            )}

            {(step === "downloading" || step === "installing") && (
              <div className="flex items-center gap-3 px-6 py-3 bg-secondary text-muted-foreground text-sm font-bold rounded-xl">
                <RefreshCw className="w-5 h-5 animate-spin" />
                İŞLEM SÜRÜYOR...
              </div>
            )}
            
            {step === "ready" && (
              <div className="px-6 py-3 bg-emerald-500/10 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-500/20">
                DOSYALAR HAZIR
              </div>
            )}
          </div>

          {(step === "downloading" || step === "installing") && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-primary uppercase">
                <span>{statusText}</span>
                <span>%{Math.round(progress)}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 text-foreground mb-4">
              <GitCommit className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">Son Değişiklikler</span>
            </div>
            <div className="space-y-3">
              {loadingCommits ? (
                <div className="h-4 bg-secondary/50 rounded w-1/2 animate-pulse" />
              ) : (
                commits.map((c) => (
                  <div key={c.sha} className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                    <p className="text-[13px] font-medium text-foreground">{c.commit.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: READY DIALOG */}
      <Dialog open={step === "ready"} onOpenChange={(open) => !open && setStep("idle")}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Download className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Yükleme Hazır!</DialogTitle>
          <DialogDescription className="pt-2 text-muted-foreground text-md">
            Kodlar indirildi. Şimdi sisteme yüklemek istiyor musunuz?
          </DialogDescription>
          <div className="grid grid-cols-2 gap-4 mt-10">
            <Button variant="outline" onClick={() => setStep("idle")} className="h-12 font-bold rounded-xl border-border">VAZGEÇ</Button>
            <Button onClick={startInstall} className="h-12 font-bold bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20">ŞİMDİ YÜKLE</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* STEP 4: DONE DIALOG */}
      <Dialog open={step === "done"} onOpenChange={(open) => !open && window.location.reload()}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl text-center p-10">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Tamamlandı!</DialogTitle>
          <DialogDescription className="pt-4 text-muted-foreground">Sistem başarıyla yeni sürüme geçirildi.</DialogDescription>
          <Button onClick={() => window.location.reload()} className="w-full mt-10 h-14 bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">PANELİ YENİLE</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
