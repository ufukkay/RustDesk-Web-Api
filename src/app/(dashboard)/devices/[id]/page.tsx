"use client";

import { useAppStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { 
  Monitor, Cpu, Database, HardDrive, Activity, 
  ArrowLeft, Play, Shield, Calendar, Clock, 
  User as UserIcon, Globe, Laptop, Server,
  RotateCcw, Power, Lock, Terminal, FileText, Send, RefreshCw,
  FolderUp, AlertTriangle, CheckCircle2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";

type CommandStatus = "idle" | "running" | "success" | "error";

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { devices, fetchDevices } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<{cmd: string, output: string, status: string}[]>([]);
  const [actionStatus, setActionStatus] = useState<Record<string, CommandStatus>>({});
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchDevices();
  }, [fetchDevices]);

  const device = devices.find(d => d.id === params.id);

  // Terminal scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  // Aksiyon çalıştırma
  const runAction = async (action: string, command?: string) => {
    if (!device) return;
    
    setActionStatus(prev => ({ ...prev, [action]: "running" }));
    setConfirmAction(null);

    try {
      const res = await fetch("/api/rustdesk/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          action: action,
          command: command || ""
        })
      });
      const data = await res.json();
      
      if (action === "terminal" && command) {
        setTerminalHistory(prev => [...prev, {
          cmd: command,
          output: "Komut kuyruğa alındı, cihazdan yanıt bekleniyor...",
          status: "idle"
        }]);

        // Sonucu beklemek için pollamaya başla
        let attempts = 0;
        const maxAttempts = 30; // 30 saniye bekle
        const pollInterval = setInterval(async () => {
          attempts++;
          
          setTerminalHistory(prev => {
            const newHistory = [...prev];
            const lastIdx = newHistory.length - 1;
            newHistory[lastIdx].output = `Komut kuyruğa alındı, cihazdan yanıt bekleniyor... (${attempts}/${maxAttempts})`;
            return newHistory;
          });

          try {
            const resRes = await fetch(`/api/rustdesk/command/result?deviceId=${device.id}`);
            const resData = await resRes.json();
            
            if (resData.output && attempts < maxAttempts) {
              setTerminalHistory(prev => {
                const newHistory = [...prev];
                const lastIdx = newHistory.length - 1;
                newHistory[lastIdx] = {
                  cmd: command,
                  output: resData.output,
                  status: "success"
                };
                return newHistory;
              });
              clearInterval(pollInterval);
            }
          } catch (e) {}

          if (attempts >= maxAttempts) {
            setTerminalHistory(prev => {
              const newHistory = [...prev];
              const lastIdx = newHistory.length - 1;
              newHistory[lastIdx].output = "Zaman aşımı: Cihazdan yanıt gelmedi. Lütfen cihazın internet bağlantısını ve agent durumunu kontrol edin.";
              newHistory[lastIdx].status = "error";
              return newHistory;
            });
            clearInterval(pollInterval);
          }
        }, 1000);
      }
      
      setActionStatus(prev => ({ ...prev, [action]: data.success ? "success" : "error" }));
      setTimeout(() => setActionStatus(prev => ({ ...prev, [action]: "idle" })), 3000);
    } catch (error) {
      setActionStatus(prev => ({ ...prev, [action]: "error" }));
      if (action === "terminal" && command) {
        setTerminalHistory(prev => [...prev, {
          cmd: command,
          output: "Bağlantı hatası. Cihaz çevrimdışı olabilir.",
          status: "error"
        }]);
      }
      setTimeout(() => setActionStatus(prev => ({ ...prev, [action]: "idle" })), 3000);
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    runAction("terminal", terminalInput.trim());
    setTerminalInput("");
  };

  if (!mounted) return null;

  if (!device) {
    return (
      <div className="p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Monitor className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Cihaz Bulunamadı</h2>
        <Button onClick={() => router.push("/devices")} variant="outline">Geri Dön</Button>
      </div>
    );
  }

  const isOnline = device.status === "online";

  const stats = [
    { label: "İşlemci (CPU)", value: device.cpu || "Bilinmiyor", icon: Cpu, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Bellek (RAM)", value: device.ram || "Bilinmiyor", icon: Database, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Disk Durumu", value: device.disk || "Bilinmiyor", icon: HardDrive, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "IP Adresi", value: (device.ip || "-").replace(/^::ffff:/, ""), icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  const actionBar = [
    { 
      id: "connect", label: "Uzaktan Bağlan", icon: Play, 
      color: "bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90", 
      onClick: () => window.open(`rustdesk://${device.id}?password=Ban41kam5`, "_self"),
      needsConfirm: false
    },
    { 
      id: "file-transfer", label: "Dosya Transferi", icon: FolderUp, 
      color: "bg-blue-600 text-white hover:bg-blue-700", 
      onClick: () => window.open(`rustdesk://file-transfer/${device.id}?password=Ban41kam5`, "_self"),
      needsConfirm: false
    },
    { 
      id: "restart", label: "Yeniden Başlat", icon: RotateCcw, 
      color: "bg-orange-500 text-white hover:bg-orange-600", 
      onClick: () => runAction("restart"),
      needsConfirm: true
    },
    { 
      id: "shutdown", label: "Kapat", icon: Power, 
      color: "bg-red-500 text-white hover:bg-red-600", 
      onClick: () => runAction("shutdown"),
      needsConfirm: true
    },
    { 
      id: "lock", label: "Ekranı Kilitle", icon: Lock, 
      color: "bg-violet-500 text-white hover:bg-violet-600", 
      onClick: () => runAction("lock"),
      needsConfirm: false
    },
    { 
      id: "fix_config", label: "Tam Yetki Ver", icon: Shield, 
      color: "bg-indigo-600 text-white hover:bg-indigo-700", 
      onClick: () => runAction("fix_config"),
      needsConfirm: true
    },
    { 
      id: "refresh", label: "Verileri Güncelle", icon: RefreshCw, 
      color: "bg-emerald-500 text-white hover:bg-emerald-600", 
      onClick: () => { fetchDevices(); setActionStatus(prev => ({ ...prev, refresh: "success" })); setTimeout(() => setActionStatus(prev => ({ ...prev, refresh: "idle" })), 2000); },
      needsConfirm: false
    },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full h-10 w-10 border-border"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-brand-ink tracking-tight">{device.name}</h1>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isOnline ? "text-emerald-600 bg-emerald-500/10 ring-1 ring-emerald-500/20" : "text-muted-foreground bg-secondary ring-1 ring-border"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
              {isOnline ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
          <p className="text-muted-foreground font-mono text-xs mt-0.5">ID: {device.id} · {device.os} · {device.user}</p>
        </div>
      </div>

      {/* === ACTION BAR === */}
      <div className="bg-card border border-border rounded-brand-lg p-4 shadow-brand-sm">
        <div className="flex flex-wrap items-center gap-2">
          {actionBar.map((action) => {
            const status = actionStatus[action.id] || "idle";
            const isRunning = status === "running";
            const isSuccess = status === "success";
            const disabled = !isOnline && action.id !== "refresh";

            return (
              <div key={action.id} className="relative">
                {/* Onay Popup */}
                {confirmAction === action.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-brand-ink text-white p-4 rounded-xl shadow-2xl z-50 w-56 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <p className="text-xs font-black uppercase">Emin misiniz?</p>
                    </div>
                    <p className="text-[11px] text-white/70 mb-3">{device.name} cihazı {action.label.toLowerCase()} edilecek.</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] h-8 font-black" onClick={action.onClick}>
                        Evet
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-[10px] h-8 font-black border-white/20 text-white hover:bg-white/10" onClick={() => setConfirmAction(null)}>
                        İptal
                      </Button>
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-ink rotate-45" />
                  </div>
                )}

                <button
                  disabled={disabled || isRunning}
                  onClick={() => {
                    if (action.needsConfirm) {
                      setConfirmAction(confirmAction === action.id ? null : action.id);
                    } else {
                      action.onClick();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all shadow-sm ${action.color} ${
                    disabled ? "opacity-40 cursor-not-allowed" : ""
                  } ${isRunning ? "animate-pulse" : ""}`}
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <action.icon className="w-4 h-4" />
                  )}
                  {action.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid sm:grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-brand-lg shadow-sm hover:shadow-brand transition-all group">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-11 h-11 ${s.bg} ${s.color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
                </div>
                <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Terminal */}
          <div className="bg-brand-ink rounded-brand-lg overflow-hidden shadow-2xl border border-white/5">
            <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-yellow" />
                <h3 className="font-black text-[11px] uppercase tracking-widest text-white/80">Uzak Terminal</h3>
                <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-white/50 font-bold">PowerShell</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
            </div>
            <div ref={terminalRef} className="p-5 h-[280px] font-mono text-xs overflow-y-auto space-y-3 custom-scrollbar">
              <p className="text-emerald-500/50">{"#"} RustDesk Remote Terminal — {device.name} ({device.id})</p>
              <p className="text-emerald-500/50">{"#"} Komut yazıp Enter{"'"}a basın veya {"\""}Çalıştır{"\""}a tıklayın.</p>
              
              {terminalHistory.length === 0 && (
                <p className="text-white/20 italic">Henüz komut çalıştırılmadı.</p>
              )}

              {terminalHistory.map((entry, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-brand-yellow">
                    <span className="text-white/30">PS {device.name}{"> "}</span>
                    {entry.cmd}
                  </p>
                  <pre className={`whitespace-pre-wrap text-[11px] leading-relaxed ${
                    entry.status === "error" ? "text-red-400" : "text-emerald-400"
                  }`}>{entry.output}</pre>
                </div>
              ))}
              <p className="text-emerald-500 animate-pulse">_</p>
            </div>
            <form onSubmit={handleTerminalSubmit} className="px-5 pb-5">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Komut yazın (örn: ipconfig, systeminfo, tasklist...)" 
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-yellow/50 focus:bg-white/[0.03] transition-all font-mono"
                  disabled={!isOnline}
                />
                <Button 
                  type="submit"
                  disabled={!isOnline || !terminalInput.trim()}
                  className="bg-brand-yellow text-brand-ink font-black hover:bg-brand-yellow/90 px-5"
                >
                  <Send className="w-4 h-4 mr-2" /> Çalıştır
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* System Details */}
          <div className="bg-card border border-border rounded-brand-lg overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-brand-ink/70">Sistem Bilgileri</h3>
              <FileText className="w-4 h-4 text-muted-foreground/50" />
            </div>
            <div className="p-5 space-y-4">
              <DetailItem icon={Monitor} label="İşletim Sistemi" value={device.os} />
              <DetailItem icon={UserIcon} label="Aktif Kullanıcı" value={device.user || "-"} />
              <DetailItem icon={Clock} label="Son Görülme" value={device.lastSeen} />
              <DetailItem icon={Shield} label="Sürüm / Grup" value={`${device.version || "1.4.x"} · ${device.group || "Genel"}`} />
            </div>
          </div>

          {/* Network Details */}
          <div className="bg-card border border-border rounded-brand-lg overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-brand-ink/70">Ağ Yapılandırması</h3>
              <Globe className="w-4 h-4 text-muted-foreground/50" />
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-col gap-1 p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Yerel IP Adresi</p>
                  <p className="text-sm font-bold text-foreground font-mono">{(device.ip || "-").replace(/^::ffff:/, "")}</p>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Ağ Geçidi (Gateway)</p>
                  <p className="text-sm font-bold text-foreground font-mono">{device.gateway || "-"}</p>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">DNS Sunucuları</p>
                  <p className="text-[11px] font-bold text-foreground font-mono break-all">{device.dns || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Security */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-brand-lg flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-emerald-800 leading-none">Güvenli Bağlantı</p>
              <p className="text-[10px] text-emerald-600/70 mt-1 uppercase font-black tracking-wider">AES-256 Bit Şifreleme</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function NetInfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[11px]">
      <span className="font-bold text-muted-foreground uppercase">{label}:</span>
      <span className="font-mono font-medium text-foreground bg-muted px-1.5 py-0.5 rounded leading-none">{value}</span>
    </div>
  );
}
