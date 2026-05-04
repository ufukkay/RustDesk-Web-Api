"use client";

import { useState, useEffect } from "react";
import { Package, Download, Terminal, Copy, Check, Shield, Globe, Cpu, Info, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

export default function BuilderPage() {
  const { serverConfig } = useAppStore();
  const [host, setHost] = useState(serverConfig.host);
  const [port, setPort] = useState(serverConfig.apiPort);
  const [copied, setCopied] = useState(false);
  const [serverKey, setServerKey] = useState("Yükleniyor...");

  useEffect(() => {
    fetch("/api/rustdesk/server-key")
      .then(res => res.json())
      .then(data => setServerKey(data.key))
      .catch(() => setServerKey("Okunamadı"));
  }, []);

  const installCommand = `irm "http://${host}:${port}/api/rustdesk/builder/install?host=${host}&port=${port}" | iex`;

  const copyToClipboard = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Fallback for non-secure contexts (HTTP via IP)
      const textArea = document.createElement("textarea");
      textArea.value = installCommand;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Kopyalama hatası:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const downloads = [
    { name: "Windows (x64)", file: "rustdesk-1.4.6-x86_64.exe", type: "EXE" },
    { name: "Linux (Debian)", file: "rustdesk-1.4.6-x86_64.deb", type: "DEB" },
    { name: "macOS (Intel/M1)", file: "rustdesk-1.4.6-x86_64.dmg", type: "DMG" },
  ];

  return (
    <div className="flex flex-col gap-6 rd2-page max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[20px] font-black tracking-tight rd2-h1">Paket Oluşturucu</h1>
        <p className="text-[12px] text-[#5C6573] font-bold rd2-sub">Kullanıcılarınıza özel RustDesk ve RMM Ajanı paketlerini hazırlayın.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 rd2-builder-grid">
        {/* Configuration Panel */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden rd2-card p-0">
            <div className="px-5 py-3 border-b border-black/[0.03] bg-[#F1F2F4]/30 rd2-card-head mb-0">
              <h2 className="text-[11px] font-black text-[#0E1116] uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#FFCC00]" /> Dağıtım Yapılandırması
              </h2>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 rd2-field-group">
                  <label className="text-[11px] font-black text-[#5C6573] uppercase tracking-wider">Sunucu Host (IP/Domain)</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F1F2F4] border border-black/5 rounded-xl rd2-field">
                    <input 
                      value={host} 
                      onChange={e => setHost(e.target.value)}
                      className="bg-transparent border-0 outline-0 text-[13.5px] font-bold flex-1"
                      placeholder="192.168.x.x"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 rd2-field-group">
                  <label className="text-[11px] font-black text-[#5C6573] uppercase tracking-wider">API Port</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F1F2F4] border border-black/5 rounded-xl rd2-field">
                    <input 
                      value={port} 
                      onChange={e => setPort(e.target.value)}
                      className="bg-transparent border-0 outline-0 text-[13.5px] font-bold flex-1"
                      placeholder="3000"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[12px] font-black text-emerald-800">
                  <Shield className="w-4 h-4" /> Aktif Sunucu Anahtarı (Key)
                </div>
                <p className="text-[11px] text-emerald-700 font-mono font-bold break-all bg-white/60 p-2 rounded-lg border border-emerald-200/50">
                  {serverKey}
                </p>
              </div>
            </div>
          </div>

          {/* Master Deployment Section */}
          <div className="bg-[#0E1116] text-white rounded-xl shadow-xl overflow-hidden relative group">
            <div className="p-8 flex flex-col gap-6 relative z-10">
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center w-fit px-2 py-0.5 rounded bg-[#FFCC00] text-[#0E1116] text-[9px] font-black uppercase tracking-widest">Önerilen</div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Terminal className="w-6 h-6 text-[#FFCC00]" /> PowerShell Tek Tık Kurulum
                </h3>
                <p className="text-white/60 text-sm max-w-[500px] font-bold">
                  Bu komut RustDesk 1.4.6'yı otomatik indirir, yapılandırır ve <b className="text-white">RMM Ajanını</b> sisteme servis olarak kurar.
                </p>
              </div>

              <div className="relative group/cmd">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 font-mono text-sm text-[#FFCC00] overflow-x-auto whitespace-nowrap scrollbar-hide ring-1 ring-white/5">
                  <span className="text-white/30 mr-2">$</span>
                  {installCommand}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-[#FFCC00] text-[#0E1116] rounded-lg hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[3]" />}
                </button>
              </div>

              {/* Kaldırma Komutu */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Sistemden Kaldırma (Uninstall)</p>
                <div className="relative group/cmd">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 font-mono text-xs text-red-400 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <span className="text-white/20 mr-2">$</span>
                    {`irm "http://${host}:${port}/api/rustdesk/builder/uninstall" | iex`}
                  </div>
                  <button
                    onClick={() => {
                      const cmd = `irm "http://${host}:${port}/api/rustdesk/builder/uninstall" | iex`;
                      navigator.clipboard.writeText(cmd);
                      alert("Kaldırma komutu kopyalandı!");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-red-400 transition-colors"
                    title="Kopyala"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-white/40 font-black uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Tam Otomatik</span>
                <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-blue-400" /> RMM Ajanı Dahil</span>
                <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-[#FFCC00]" /> v1.4.6 Core</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFCC00]/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          </div>
        </div>

        {/* Individual Packages */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden rd2-card p-0 h-fit">
            <div className="px-5 py-3 border-b border-black/[0.03] bg-[#F1F2F4]/30 rd2-card-head mb-0">
              <h2 className="text-[11px] font-black text-[#0E1116] uppercase tracking-widest">Bireysel Paketler</h2>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {downloads.map((d) => (
                <div key={d.name} className="group p-4 border border-black/5 rounded-xl hover:bg-[#F1F2F4]/50 transition-all rd2-pkg-row">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F1F2F4] flex items-center justify-center text-[#5C6573] group-hover:bg-[#FFCC00]/20 group-hover:text-[#0E1116] transition-all rd2-pkg-icon">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-[#0E1116]">{d.name}</p>
                      <p className="text-[10px] text-[#8B92A0] font-black uppercase tracking-tight">{d.type} Dosyası</p>
                    </div>
                  </div>
                  <button 
                    className="w-full py-2 rounded-lg bg-white border border-black/5 text-[11px] font-black uppercase tracking-widest text-[#0E1116] hover:bg-[#FFCC00] hover:border-[#FFCC00] transition-all rd2-btn rd2-btn-sm"
                    onClick={() => {
                      window.open(`https://github.com/rustdesk/rustdesk/releases/download/1.4.6/${d.file}`, '_blank');
                    }}
                  >
                    Resmi Paketi İndir
                  </button>
                </div>
              ))}
              
              <div className="pt-4 mt-2 border-t border-black/[0.03]">
                <a 
                  href="https://github.com/rustdesk/rustdesk/releases/tag/1.4.6" 
                  target="_blank" 
                  className="flex items-center justify-center gap-2 text-[11px] font-black text-[#8B92A0] hover:text-[#0E1116] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Tüm Sürümleri Gör (GitHub)
                </a>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#FFCC00]/10 border border-[#FFCC00]/20 rounded-xl p-5 flex flex-col gap-3 rd2-info-panel">
            <div className="flex items-center gap-2 text-[#0E1116] font-black text-[11px] uppercase tracking-wider">
              <Info className="w-4 h-4 text-[#FFCC00]" /> Önemli Not
            </div>
            <p className="text-[12px] text-[#5C6573] font-bold leading-relaxed">
              Windows üzerinde isimlendirme ile otomatik konfigürasyon için indirilen <b>.exe</b> dosyasının adını değiştirmeyin. PowerShell kurulumu bu işlemi sizin yerinize otomatik yapar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
