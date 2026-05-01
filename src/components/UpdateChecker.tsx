"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, Clock, Zap, CheckCircle2, ShieldCheck, Activity, GitCommit, ArrowRight, Play, X } from "lucide-react";
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

  // Polling for installation status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    if (step === "installing") {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch("/api/system/update/status");
          const data = await res.json();
          if (data.status === "done") {
            setStep("done");
            const now = new Date().toLocaleString("tr-TR");
            localStorage.setItem("last_update_check", now);
            setLastChecked(now);
            clearInterval(pollInterval);
          } else if (data.status === "error") {
            alert("Kurulum hatası: " + data.message);
            setStep("idle");
            clearInterval(pollInterval);
          }
        } catch (e) {
          console.error("Durum kontrolü yapılamadı.");
        }
      }, 3000);
    }
    return () => clearInterval(pollInterval);
  }, [step]);

  // Progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((step === "downloading" || step === "installing") && progress < 98) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) return 98;
          const increment = step === "downloading" ? 2 : (prev > 60 ? 0.3 : 0.7);
          return prev + increment;
        });
      }, step === "downloading" ? 100 : 800);
    }
    return () => clearInterval(interval);
  }, [step, progress]);

  const startDownload = async () => {
    setStep("downloading");
    setProgress(0);
    setStatusText("Güncelleme dosyaları hazırlanıyor...");
    
    // Simulate/Trigger Fetch
    setTimeout(() => {
      setStep("ready");
      setProgress(100);
      setStatusText("Dosyalar indirildi, kuruluma hazır.");
    }, 4000);
  };

  const startInstall = async () => {
    setStep("installing");
    setProgress(0);
    setStatusText("Yeni sürüm kuruluyor ve derleniyor...");
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
        <div className="p-10 space-y-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Kurulum Sihirbazı</h3>
              <p className="text-sm text-muted-foreground max-w-md">Sistem güncellemelerini iki aşamalı olarak güvenle yönetin.</p>
            </div>
            
            {step === "idle" && (
              <button
                onClick={startDownload}
                className="flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-95 transition-all active:scale-95 shrink-0"
              >
                <Download className="w-5 h-5" />
                GÜNCELLEMELERİ İNDİR
              </button>
            )}

            {(step === "downloading" || step === "installing") && (
              <div className="flex items-center gap-3 px-8 py-4 bg-secondary text-muted-foreground text-sm font-bold rounded-xl shrink-0">
                <RefreshCw className="w-5 h-5 animate-spin" />
                LÜTFEN BEKLEYİN...
              </div>
            )}
            
            {step === "ready" && (
              <div className="flex items-center gap-3 px-8 py-4 bg-emerald-500/10 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
                DOSYALAR HAZIR
              </div>
            )}
          </div>

          {/* Progress (Visible during download or install) */}
          {(step === "downloading" || step === "installing") && (
            <div className="space-y-4 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">{statusText}</span>
                <span className="text-sm font-black text-primary">%{Math.round(progress)}</span>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden border border-border p-1">
                <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out relative" style={{ width: `${progress}%` }}>
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-stripe_1s_linear_infinite]" />
                </div>
              </div>
            </div>
          )}

          {/* Changelog */}
          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 text-foreground mb-4">
              <GitCommit className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase">Sürüm Notları</span>
            </div>
            <div className="space-y-4">
              {loadingCommits ? (
                <div className="h-4 bg-secondary/50 rounded w-1/2 animate-pulse" />
              ) : (
                commits.map((c) => (
                  <div key={c.sha} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-[13px] font-medium text-foreground leading-tight text-left">{c.commit.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: READY DIALOG */}
      <Dialog open={step === "ready"} onOpenChange={(open) => !open && setStep("idle")}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary/10 p-8 flex flex-col items-center border-b border-border">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Download className="w-8 h-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight text-center">Dosyalar İndirildi!</DialogTitle>
          </div>
          <div className="p-8">
            <DialogDescription className="text-center text-md text-muted-foreground leading-relaxed">
              Güncelleme paketleri başarıyla çekildi. Şimdi sistemi yeni sürüme yükseltmek ister misiniz? 
              <br/><br/>
              <span className="text-xs font-semibold text-primary/80 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">Bu işlem 1-2 dakika sürebilir.</span>
            </DialogDescription>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <Button 
                variant="outline" 
                onClick={() => setStep("idle")}
                className="h-12 font-bold border-border text-muted-foreground hover:bg-secondary rounded-xl"
              >
                <X className="w-4 h-4 mr-2" /> DAHA SONRA
              </Button>
              <Button 
                onClick={startInstall}
                className="h-12 font-bold bg-primary text-primary-foreground hover:opacity-95 rounded-xl shadow-lg shadow-primary/20"
              >
                <Play className="w-4 h-4 mr-2" /> ŞİMDİ YÜKLE
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* STEP 4: DONE DIALOG */}
      <Dialog open={step === "done"} onOpenChange={(open) => !open && window.location.reload()}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl text-center p-10">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Sistem Güncel!</DialogTitle>
          <DialogDescription className="pt-4 text-muted-foreground">
            Yeni sürüm başarıyla yüklendi. Değişikliklerin etkili olması için paneli yenilemeniz gerekiyor.
          </DialogDescription>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full mt-10 h-14 bg-emerald-500 text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            PANELİ ŞİMDİ YENİLE
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
