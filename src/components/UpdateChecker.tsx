"use client";

import { useState, useCallback } from "react";
import { RefreshCw, CheckCircle, AlertCircle, Download, ExternalLink, Tag, Clock } from "lucide-react";

const CURRENT_VERSION = "1.0.0";
const GITHUB_REPO = "ufukkay/RustDesk-Web-Api";

interface Release {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

function semverGt(a: string, b: string): boolean {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

export function UpdateChecker() {
  const [status, setStatus] = useState<"idle" | "checking" | "latest" | "available" | "error">("idle");
  const [release, setRelease] = useState<Release | null>(null);
  const [error, setError] = useState("");

  const checkForUpdates = useCallback(async () => {
    setStatus("checking");
    setRelease(null);
    setError("");
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      
      if (res.status === 404) {
        setStatus("latest");
        return;
      }

      if (!res.ok) throw new Error("GitHub API yanıt vermedi.");
      const data: Release = await res.json();
      setRelease(data);
      if (semverGt(data.tag_name, CURRENT_VERSION)) {
        setStatus("available");
      } else {
        setStatus("latest");
      }
    } catch (e: any) {
      setError(e.message || "Bilinmeyen hata");
      setStatus("error");
    }
  }, []);

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  const installUpdate = async () => {
    if (!confirm("Sistem güncellenecek ve panel birkaç dakika kapalı kalacaktır. Onaylıyor musunuz?")) return;
    
    setIsUpdating(true);
    setUpdateMsg("Kodlar çekiliyor ve derleniyor, lütfen bekleyin...");
    
    try {
      const res = await fetch("/api/system/update", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setUpdateMsg("İşlem başlatıldı! Sunucu arka planda derleme yapıyor. Yaklaşık 2 dakika sonra sayfa otomatik yenilenecek...");
        // Sayfayı 2 dakika sonra yenile (Build süresi tahmini)
        setTimeout(() => window.location.reload(), 120000);
      } else {
        throw new Error(data.error || "Güncelleme başlatılamadı.");
      }
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
      setIsUpdating(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-brand-lg border border-brand-ink/5 shadow-brand-sm overflow-hidden animate-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-brand-ink/5 bg-brand-bg/10 flex items-center justify-between">
        <div>
          <h3 className="font-black text-brand-ink text-sm uppercase tracking-tight">Yazılım Güncellemesi</h3>
          <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">GitHub Versiyon Kontrolü</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-black bg-brand-yellow text-brand-ink px-3 py-1.5 rounded-full shadow-brand-sm ring-1 ring-brand-ink/10">
          <Tag className="w-3.5 h-3.5" />
          v{CURRENT_VERSION} · MEVCUT
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Check button */}
        <button
          onClick={checkForUpdates}
          disabled={status === "checking"}
          className="flex items-center gap-3 px-6 py-3 bg-brand-yellow text-brand-ink text-[13px] font-black rounded-brand shadow-brand-sm ring-1 ring-brand-ink/10 hover:bg-brand-yellow/90 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${status === "checking" ? "animate-spin" : ""}`} />
          {status === "checking" ? "KONTROL EDİLİYOR..." : "GÜNCELLEMELERİ KONTROL ET"}
        </button>

        {/* Status: up to date */}
        {status === "latest" && (
          <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-brand-lg">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">Sisteminiz Güncel</p>
              <p className="text-[12px] text-emerald-700 font-bold mt-1 leading-relaxed">
                Şu an en son kararlı sürümü kullanıyorsunuz. Bir işlem yapmanıza gerek yoktur.
              </p>
            </div>
          </div>
        )}

        {/* Status: update available */}
        {status === "available" && release && (
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-5 bg-blue-50 border border-blue-100 rounded-brand-lg">
              <Download className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-black text-blue-900 uppercase tracking-tight">Yeni Sürüm Tespit Edildi!</p>
                  <span className="text-[11px] font-black text-white bg-blue-600 px-3 py-1 rounded-full shadow-brand-sm">
                    {release.tag_name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-400 mt-2 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  Yayınlanma: {formatDate(release.published_at)}
                </div>
              </div>
            </div>

            {/* Release notes */}
            {release.body && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-brand-lg">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sürüm Notları</p>
                <div className="text-[12px] text-slate-600 font-medium whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {release.body}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <a
                href={release.html_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-3 bg-brand-ink text-white text-[13px] font-black rounded-brand shadow-brand hover:opacity-90 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                GITHUB'DA İNCELE
              </a>

              <button
                onClick={installUpdate}
                disabled={isUpdating}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-brand-yellow text-brand-ink text-[13px] font-black rounded-brand shadow-brand-sm ring-1 ring-brand-ink/10 hover:bg-brand-yellow/90 transition-all disabled:opacity-50"
              >
                {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isUpdating ? "GÜNCELLENİYOR..." : "ŞİMDİ GÜNCELLE"}
              </button>
            </div>

            {isUpdating && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-brand text-amber-700 font-bold text-[12px]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {updateMsg}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-brand-lg">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-900 uppercase tracking-tight">Bağlantı Hatası</p>
              <p className="text-[12px] text-red-600 font-bold mt-1 leading-relaxed">
                GitHub sunucularına erişilemedi: {error}
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-[11px] text-slate-400 font-bold flex items-center gap-2.5 pt-4 border-t border-brand-ink/5 uppercase tracking-wide">
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span>
            Kaynak Repo: <a href={`https://github.com/${GITHUB_REPO}`} target="_blank" rel="noreferrer" className="text-brand-ink hover:underline">ufukkay/RustDesk-Web-Api</a>
          </span>
        </div>
      </div>
    </div>
  );
}
