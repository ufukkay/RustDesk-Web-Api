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
      if (!res.ok) throw new Error("GitHub API yanıt vermedi.");
      const data: Release = await res.json();
      setRelease(data);
      if (semverGt(data.tag_name, CURRENT_VERSION)) {
        setStatus("available");
      } else {
        setStatus("latest");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
      setStatus("error");
    }
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Yazılım Güncellemesi</h3>
          <p className="text-xs text-slate-500 mt-0.5">GitHub üzerinden en güncel sürümü kontrol edin</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-semibold">
          <Tag className="w-3 h-3" />
          v{CURRENT_VERSION} — Mevcut
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Check button */}
        <button
          onClick={checkForUpdates}
          disabled={status === "checking"}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${status === "checking" ? "animate-spin" : ""}`} />
          {status === "checking" ? "Kontrol ediliyor..." : "Güncelleme Kontrol Et"}
        </button>

        {/* Status: up to date */}
        {status === "latest" && (
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Sisteminiz Güncel</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                En güncel sürümü kullanıyorsunuz — <span className="font-semibold">{release?.tag_name}</span>
                {release && <span className="ml-2 opacity-70">({formatDate(release.published_at)})</span>}
              </p>
            </div>
          </div>
        )}

        {/* Status: update available */}
        {status === "available" && release && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <Download className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-bold text-blue-900">Yeni Sürüm Mevcut!</p>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                    {release.tag_name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(release.published_at)}
                </div>
              </div>
            </div>

            {/* Release notes */}
            {release.body && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Sürüm Notları</p>
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
                  {release.body}
                </pre>
              </div>
            )}

            <a
              href={release.html_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              GitHub&apos;da Güncellemeyi Gör
            </a>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Bağlantı Hatası</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-100">
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span>
            Kaynak: <a href={`https://github.com/${GITHUB_REPO}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">github.com/{GITHUB_REPO}</a>
          </span>
        </div>
      </div>
    </div>
  );
}
