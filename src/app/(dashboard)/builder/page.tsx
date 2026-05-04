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
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Paket Oluşturucu (Builder)
          </h1>
          <p className="text-sm text-muted-foreground">Kullanıcılarınıza özel RustDesk ve RMM Ajanı paketlerini hazırlayın.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
          <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">v1.4.6 Destekli</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-brand-lg border border-border shadow-brand-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h2 className="text-[11px] font-black text-brand-ink uppercase tracking-widest">Dağıtım Yapılandırması</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Sunucu Host (IP/Domain)</Label>
                  <Input 
                    value={host} 
                    onChange={e => setHost(e.target.value)}
                    className="bg-secondary/30 border-border h-11 font-bold" 
                    placeholder="192.168.x.x"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">API Port</Label>
                  <Input 
                    value={port} 
                    onChange={e => setPort(e.target.value)}
                    className="bg-secondary/30 border-border h-11 font-bold" 
                    placeholder="3000"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Shield className="w-4 h-4 text-emerald-500" /> Aktif Sunucu Anahtarı (Key)
                </div>
                <p className="text-[11px] text-muted-foreground font-mono break-all bg-white/50 dark:bg-black/20 p-2 rounded border border-border/50">
                  {serverKey}
                </p>
              </div>
            </div>
          </div>

          {/* Master Deployment Section */}
          <div className="bg-brand-ink text-white rounded-brand-lg shadow-brand overflow-hidden relative group">
            <div className="p-8 space-y-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-brand-yellow text-brand-ink text-[9px] font-black uppercase tracking-widest">Önerilen</div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Terminal className="w-6 h-6 text-brand-yellow" /> PowerShell Tek Tık Kurulum
                </h3>
                <p className="text-white/60 text-sm max-w-[500px]">
                  Bu komut RustDesk 1.4.6'yı otomatik indirir, yapılandırır ve <b>RMM Ajanını</b> sisteme servis olarak kurar.
                </p>
              </div>

              <div className="relative group/cmd">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-5 font-mono text-sm text-brand-yellow overflow-x-auto whitespace-nowrap scrollbar-hide ring-1 ring-white/5">
                  <span className="text-white/30 mr-2">$</span>
                  {installCommand}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-brand-yellow text-brand-ink rounded-lg hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[3]" />}
                </button>
              </div>

              {/* Kaldırma Komutu */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Sistemden Kaldırma (Uninstall)</p>
                <div className="relative group/cmd">
                  <div className="bg-black/20 border border-white/5 rounded-xl p-4 font-mono text-xs text-red-400 overflow-x-auto whitespace-nowrap scrollbar-hide">
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

              <div className="flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Tam Otomatik</span>
                <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-blue-400" /> RMM Ajanı Dahil</span>
                <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-brand-yellow" /> v1.4.6 Core</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          </div>
        </div>

        {/* Individual Packages */}
        <div className="space-y-6">
          <div className="bg-card rounded-brand-lg border border-border shadow-brand-sm overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h2 className="text-[11px] font-black text-brand-ink uppercase tracking-widest">Bireysel Paketler</h2>
            </div>
            <div className="p-6 space-y-4">
              {downloads.map((d) => (
                <div key={d.name} className="group p-4 border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{d.name}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">{d.type} Dosyası</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    onClick={() => {
                      const customizedName = `rustdesk-host=${host}-key=${serverKey.trim()}.exe`;
                      // Client-side download logic could go here or link to a proxy
                      window.open(`https://github.com/rustdesk/rustdesk/releases/download/1.4.6/${d.file}`, '_blank');
                    }}
                  >
                    Resmi Paketi İndir
                  </Button>
                </div>
              ))}
              
              <div className="pt-4 mt-4 border-t border-border">
                <a 
                  href="https://github.com/rustdesk/rustdesk/releases/tag/1.4.6" 
                  target="_blank" 
                  className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Tüm Sürümleri Gör (GitHub)
                </a>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-secondary/30 rounded-brand-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-tight">
              <Info className="w-4 h-4 text-blue-500" /> Önemli Not
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Windows üzerinde isimlendirme ile otomatik konfigürasyon için indirilen <b>.exe</b> dosyasının adını değiştirmeyin. PowerShell kurulumu bu işlemi sizin yerinize otomatik yapar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
