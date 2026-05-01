"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, Clock, Zap, CheckCircle2, ShieldCheck, Activity, GitCommit } from "lucide-react";
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

export function UpdateChecker() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Sistem Hazır");
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
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

  // Real-time polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (isUpdating) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch("/api/system/update/status");
          const data = await res.json();
          
          if (data.status === "done") {
            setProgress(100);
            setIsUpdating(false);
            setIsDone(true);
            const now = new Date().toLocaleString("tr-TR");
            localStorage.setItem("last_update_check", now);
            setLastChecked(now);
            clearInterval(pollInterval);
          } else if (data.status === "error") {
            alert("Güncelleme hatası: " + data.message);
            setIsUpdating(false);
            clearInterval(pollInterval);
          }
        } catch (e) {
          console.error("Durum kontrolü yapılamadı.");
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => clearInterval(pollInterval);
  }, [isUpdating]);

  // Smooth UI progress simulation (max 95% until real 'done')
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (isUpdating && progress < 95) {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return 95;
          const step = prev < 30 ? 1 : prev < 70 ? 0.5 : 0.2;
          return prev + step;
        });
      }, 800);
    }
    return () => clearInterval(progressInterval);
  }, [isUpdating, progress]);

  useEffect(() => {
    if (!isUpdating) return;
    const messages = [
      { p: 0, t: "GitHub senkronizasyonu başlatılıyor..." },
      { p: 20, t: "Yeni paketler ve bağımlılıklar yükleniyor..." },
      { p: 50, t: "Next.js Build: Proje derleniyor (Build)..." },
      { p: 85, t: "Optimizasyon yapılıyor ve servisler yeniden başlatılıyor..." },
    ];
    const current = [...messages].reverse().find(m => progress >= m.p);
    if (current) setStatusText(current.t);
  }, [progress, isUpdating]);

  const handleUpdate = async () => {
    if (!confirm("Sistem gerçek zamanlı olarak güncellenecektir. Onaylıyor musunuz?")) return;
    setIsUpdating(true);
    setProgress(0);
    try {
      const res = await fetch("/api/system/update", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    } catch (err) {
      alert("Hata: " + (err instanceof Error ? err.message : "Bağlantı Hatası"));
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-primary" /></div>
          <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">Güvenlik</p><p className="text-sm font-semibold text-foreground">Aktif</p></div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Activity className="w-5 h-5 text-emerald-500" /></div>
          <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">Canlı İzleme</p><p className="text-sm font-semibold text-foreground">Açık</p></div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><Clock className="w-5 h-5 text-muted-foreground" /></div>
          <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">Versiyon</p><p className="text-xs font-semibold text-foreground">v2.4.0-stable</p></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-md overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl font-bold text-foreground">Gerçek Zamanlı Güncelleme</h3>
              <p className="text-sm text-muted-foreground max-w-md">Sistem, sunucudaki build sürecini anlık olarak takip eder ve işlem bitince sizi bilgilendirir.</p>
            </div>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-95 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isUpdating ? "İŞLEM TAKİP EDİLİYOR" : "GÜNCELLEMEYİ BAŞLAT"}
            </button>
          </div>

          {/* Changes List */}
          <div className="bg-muted/30 rounded-xl p-6 space-y-4 border border-border">
            <div className="flex items-center gap-2 text-foreground mb-2">
              <GitCommit className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-tight">Yeni Gelen Değişiklikler</span>
            </div>
            <div className="space-y-4">
              {loadingCommits ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /> Bekleyiniz...</div>
              ) : (
                commits.map((c) => (
                  <div key={c.sha} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground leading-tight">{c.commit.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">{new Date(c.commit.author.date).toLocaleString("tr-TR")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-time Progress Section */}
          {isUpdating && (
            <div className="space-y-5 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-sm font-semibold text-foreground">{statusText}</span>
                </div>
                <span className="text-sm font-black text-primary">%{Math.round(progress)}</span>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden border border-border p-1">
                <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out relative" style={{ width: `${progress}%` }}>
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-stripe_1s_linear_infinite]" />
                </div>
              </div>
              <p className="text-[11px] text-center text-muted-foreground italic">Build tamamlandığında bu pencere otomatik olarak onay verecektir.</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Durum: {isUpdating ? "Canlı Takip" : "Stabil"}</div>
            <div>Son Senkron: {lastChecked || "Henüz yapılmadı"}</div>
          </div>
        </div>
      </div>

      <Dialog open={isDone} onOpenChange={setIsDone}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
          <DialogHeader className="flex flex-col items-center justify-center pt-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20"><CheckCircle2 className="w-12 h-12 text-emerald-500" /></div>
            <DialogTitle className="text-2xl font-bold text-foreground">İşlem Tamamlandı!</DialogTitle>
            <DialogDescription className="text-center pt-3 text-muted-foreground leading-relaxed">Sunucudaki build süreci başarıyla bitti. Panel yeni sürümle tazelemek için hazır.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pb-8 pt-4">
            <Button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground font-bold px-12 py-6 rounded-xl text-md shadow-lg shadow-primary/20 hover:opacity-95">HEMEN YENİLE</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
