"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, RefreshCw, CheckCircle, AlertCircle, Info, Terminal } from "lucide-react";

type UpdateStatus = "idle" | "running" | "restarting" | "done" | "error" | "no-update";

interface StageInfo {
  key: string;
  label: string;
  icon: string;
  step: number;
}

interface PollData {
  status: "idle" | "running" | "done" | "error";
  stage?: StageInfo;
  progress?: number;
  logs?: string[];
  message?: string;
}

const TOTAL_STEPS = 6;

const STAGE_STEPS = [
  { key: "start",   label: "Hazırlanıyor",            step: 1 },
  { key: "fetch",   label: "Kod çekiliyor",           step: 2 },
  { key: "install", label: "Bağımlılıklar yükleniyor", step: 3 },
  { key: "build",   label: "Derleniyor",              step: 4 },
  { key: "restart", label: "Servis yeniden başlatılıyor", step: 5 },
  { key: "done",    label: "Tamamlandı",              step: 6 },
];

export function UpdateChecker() {
  const [uiStatus, setUiStatus] = useState<UpdateStatus>("idle");
  const [stageInfo, setStageInfo] = useState<StageInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/system/update/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: PollData = await res.json();
      setConsecutiveErrors(0);

      if (data.logs) setLogs(data.logs);

      if (data.status === "done") {
        setUiStatus("done");
        setProgress(100);
        stopPolling();
        setTimeout(() => window.location.reload(), 3000);
        return;
      }

      if (data.status === "error") {
        setUiStatus("error");
        setErrorMsg(data.message || "Bilinmeyen hata.");
        stopPolling();
        return;
      }

      if (data.status === "running" && data.stage) {
        setStageInfo(data.stage);
        setProgress(data.progress ?? 0);

        if (data.stage.key === "restart") {
          setUiStatus("restarting");
        } else {
          setUiStatus("running");
        }
      }
    } catch {
      // Fetch hatası = pm2 yeniden başlatılıyor (502) → normal durum
      setConsecutiveErrors((n) => {
        const next = n + 1;
        if (next >= 2) {
          setUiStatus("restarting");
          setStageInfo({ key: "restart", label: "Servis yeniden başlatılıyor", icon: "🔄", step: 5 });
          setProgress(85);
        }
        return next;
      });
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollingRef.current = setInterval(pollStatus, 2500);
  }, [pollStatus, stopPolling]);

  // Servis yeniden başladıktan sonra sayfayı yenile
  useEffect(() => {
    if (uiStatus !== "restarting") return;
    const checkBack = setInterval(async () => {
      try {
        const res = await fetch("/api/system/update/status");
        if (res.ok) {
          const data: PollData = await res.json();
          if (data.status === "done") {
            setUiStatus("done");
            setProgress(100);
            stopPolling();
            clearInterval(checkBack);
            setTimeout(() => window.location.reload(), 2000);
          } else if (data.status !== "error") {
            // Tekrar running, polling devam etsin
            startPolling();
            clearInterval(checkBack);
          }
        }
      } catch {
        // hala kapalı, bekle
      }
    }, 3000);
    return () => clearInterval(checkBack);
  }, [uiStatus, startPolling, stopPolling]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleUpdate = async () => {
    if (!confirm("Güncelleme başlatılacak. Panel 2-3 dakika boyunca hizmet dışı kalabilir. Devam etmek istiyor musunuz?")) return;

    setUiStatus("running");
    setProgress(5);
    setLogs([]);
    setErrorMsg("");
    setConsecutiveErrors(0);

    try {
      // Önce güncelleme var mı kontrol et
      const checkRes = await fetch("/api/system/update/check");
      const checkData = await checkRes.json();

      if (!checkData.hasUpdate) {
        setUiStatus("no-update");
        return;
      }

      // Güncellemeyi başlat
      const res = await fetch("/api/system/update", { method: "POST" });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Güncelleme başlatılamadı.");

      setStageInfo(STAGE_STEPS[0] as StageInfo);
      startPolling();
    } catch (err: any) {
      setErrorMsg(err.message);
      setUiStatus("error");
    }
  };

  const progressBarWidth = `${progress}%`;
  const isRestarting = uiStatus === "restarting";
  const isActive = uiStatus === "running" || isRestarting;

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in duration-500">
      <div className="bg-card rounded-2xl border-2 border-border p-8 shadow-sm space-y-6">

        {/* Başlık */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Sistem Güncelleme</h2>
          <p className="text-sm text-muted-foreground font-medium">Sistem sürümünü GitHub ile senkronize edin.</p>
        </div>

        {/* İçerik */}
        <div className="flex flex-col items-center gap-6 py-4">

          {/* IDLE / NO-UPDATE */}
          {(uiStatus === "idle" || uiStatus === "no-update") && (
            <div className="w-full space-y-4 flex flex-col items-center">
              {uiStatus === "no-update" && (
                <div className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 text-blue-600 animate-in slide-in-from-top-2">
                  <Info className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold uppercase tracking-tight">Sisteminiz şu an en güncel sürümde.</p>
                </div>
              )}
              <button
                onClick={handleUpdate}
                className="w-full max-w-sm h-16 bg-primary text-primary-foreground font-black text-lg rounded-xl shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-6 h-6" />
                GÜNCELLEMELERİ DENETLE
              </button>
            </div>
          )}

          {/* RUNNING / RESTARTING */}
          {isActive && (
            <div className="w-full space-y-5 animate-in fade-in">

              {/* Aşama adımları */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {STAGE_STEPS.map((s) => {
                  const currentStep = stageInfo?.step ?? 0;
                  const done = s.step < currentStep;
                  const active = s.step === currentStep;
                  return (
                    <div
                      key={s.key}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all ${
                        done    ? "text-emerald-500" :
                        active  ? "text-primary bg-primary/10" :
                                  "text-muted-foreground/40"
                      }`}
                    >
                      <span className="text-lg">
                        {done ? "✅" : active ? (isRestarting && s.key === "restart" ? "⚡" : "⏳") : "○"}
                      </span>
                      <span className="text-[9px] font-bold uppercase leading-tight">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* İlerleme çubuğu */}
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${
                    isRestarting ? "bg-orange-500 animate-pulse" : "bg-primary"
                  }`}
                  style={{ width: progressBarWidth }}
                />
              </div>

              {/* Mevcut aşama mesajı */}
              <div className={`w-full p-4 rounded-xl border flex items-center gap-3 ${
                isRestarting
                  ? "bg-orange-500/10 border-orange-500/20 text-orange-600"
                  : "bg-primary/5 border-primary/20 text-primary"
              }`}>
                <RefreshCw className="w-5 h-5 shrink-0 animate-spin" />
                <div>
                  <p className="font-black uppercase text-sm tracking-tight">
                    {isRestarting ? "Servis Yeniden Başlatılıyor" : (stageInfo?.label ?? "İşleniyor")}
                  </p>
                  {isRestarting && (
                    <p className="text-xs opacity-70 mt-0.5">
                      Panel kısa süreliğine kapanacak. Otomatik olarak yeniden bağlanacaksınız.
                    </p>
                  )}
                </div>
              </div>

              {/* Log görüntüleyici */}
              <div className="w-full">
                <button
                  onClick={() => setShowLogs((v) => !v)}
                  className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  {showLogs ? "Logları Gizle" : "Logları Göster"}
                </button>
                {showLogs && (
                  <div className="mt-2 bg-black/80 rounded-xl p-4 font-mono text-[11px] text-green-400 max-h-40 overflow-y-auto space-y-0.5">
                    {logs.length === 0 ? (
                      <span className="text-gray-500">Bekleniyor...</span>
                    ) : (
                      logs.map((line, i) => <div key={i}>{line}</div>)
                    )}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DONE */}
          {uiStatus === "done" && (
            <div className="w-full p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-xl text-center space-y-4 animate-in zoom-in-95">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-lg font-black text-emerald-600 uppercase tracking-tight">Güncelleme Tamamlandı!</p>
                <p className="text-sm text-emerald-600/80">Sayfa 3 saniye içinde otomatik yenilenecektir...</p>
              </div>
            </div>
          )}

          {/* ERROR */}
          {uiStatus === "error" && (
            <div className="w-full p-6 bg-destructive/10 border-2 border-destructive/20 rounded-xl text-center space-y-4 animate-in zoom-in-95">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <div className="space-y-1">
                <p className="font-black text-destructive uppercase tracking-tight">Güncelleme Başarısız!</p>
                {errorMsg && <p className="text-xs text-destructive/70 font-mono break-all">{errorMsg}</p>}
              </div>
              <button
                onClick={() => setUiStatus("idle")}
                className="text-sm underline font-black uppercase text-destructive hover:opacity-70"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>

        {/* Durum çubuğu */}
        <div className="pt-6 border-t border-border flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${
            isActive ? "bg-orange-500 animate-pulse" :
            uiStatus === "done" ? "bg-emerald-500" :
            "bg-emerald-500 animate-pulse"
          }`} />
          {isActive ? "Güncelleme Devam Ediyor" : uiStatus === "done" ? "Güncelleme Tamamlandı" : "Bulut Sunucu Bağlantısı Aktif"}
        </div>
      </div>
    </div>
  );
}
