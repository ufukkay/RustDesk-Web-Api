"use client";

import { useAppStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { 
  Monitor, Cpu, Database, HardDrive, Activity, 
  ArrowLeft, Play, Shield, Calendar, Clock, 
  User as UserIcon, Globe, Laptop, Server,
  RotateCcw, Power, Lock, Terminal, FileText, Send, RefreshCw,
  FolderUp, AlertTriangle, CheckCircle2, Loader2, ChevronLeft,
  Network
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

type CommandStatus = "idle" | "running" | "success" | "error";
type TabType = "overview" | "networks" | "terminal";

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { devices, fetchDevices } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<{cmd: string, output: string, status: string}[]>([]);
  const [actionStatus, setActionStatus] = useState<Record<string, CommandStatus>>({});
  const terminalRef = useRef<HTMLDivElement>(null);

  const [connSettings, setConnSettings] = useState({ host: "", serverKey: "", defaultPassword: "" });
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchDevices();
    fetch("/api/rustdesk/settings")
      .then(r => r.json())
      .then(d => setConnSettings({ 
        host: d.idServer || d.host || "", 
        serverKey: d.serverKey || "", 
        defaultPassword: d.defaultPassword || "" 
      }))
      .catch(() => {});
  }, [fetchDevices]);

  const device = devices.find(d => d.id === params.id);

  useEffect(() => {
    if (!device?.id) return;

    const s = io({
      query: { deviceId: device.id, type: "dashboard" }
    });

    s.on("connect", () => console.log("Connected to command socket"));
    
    s.on("result", (data: any) => {
      if (data.action === "terminal") {
        setTerminalHistory(prev => {
          const newHistory = [...prev];
          for (let i = newHistory.length - 1; i >= 0; i--) {
            if (newHistory[i].cmd === data.command && newHistory[i].status === "idle") {
              const output = data.isBase64 ? atob(data.output) : data.output;
              newHistory[i] = { ...newHistory[i], output, status: "success" };
              break;
            }
          }
          return newHistory;
        });
      }
    });

    s.on("telemetry_update", (data: any) => {
      console.log("Telemetry received:", data);
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [device?.id]);

  useEffect(() => {
    if (activeTab === "terminal" && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory, activeTab]);

  const handleConnect = () => {
    if (!device) return;
    const cleanId = String(device.id).replace(/\s+/g, "");
    const { host, serverKey, defaultPassword } = connSettings;
    const url = `rustdesk://${cleanId}?password=${defaultPassword}&host=${host}`;
    window.open(url, "_self");
  };

  const runAction = async (action: string, command?: string) => {
    if (!device || !socket) return;
    setActionStatus(prev => ({ ...prev, [action]: "running" }));

    try {
      socket.emit("send_command", { 
        deviceId: device.id, 
        action, 
        command: command || "" 
      });
      
      if (action === "terminal" && command) {
        setTerminalHistory(prev => [...prev, { cmd: command, output: "Yanıt bekleniyor...", status: "idle" }]);
      }
      
      setTimeout(() => setActionStatus(prev => ({ ...prev, [action]: "idle" })), 2000);
    } catch (error) {
      setActionStatus(prev => ({ ...prev, [action]: "error" }));
    }
  };

  if (!mounted || !device) return null;

  const isOnline = device.status === "online";
  const netDetails = Array.isArray(device.net_details) ? device.net_details : [];

  return (
    <div className="rd2-page max-w-[1200px] mx-auto pb-10">
      {/* Header */}
      <div className="rd2-detail-header mb-6">
        <button className="rd2-back-btn" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="rd2-h1 !m-0">{device.name}</h2>
            <span className={`rd2-pill ${isOnline ? "rd2-pill-on" : "rd2-pill-off"}`}>
              <span className={`rd2-dot ${isOnline ? "rd2-dot-green animate-brand-pulse" : "rd2-dot-gray"}`} />
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <div className="rd2-mono rd2-muted-sm mt-1">ID: {device.id} · {device.os} · {device.user}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="rd2-card rd2-action-bar mb-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <button 
          onClick={handleConnect}
          disabled={!isOnline}
          className="rd2-btn"
          style={isOnline ? { background: "#FFCC00", color: "#0E1116", border: "1px solid #0E111614" } : { opacity: 0.5 }}
        >
          <Play width="14" height="14" /> Uzaktan Bağlan
        </button>
        
        <button 
          onClick={() => window.open(`rustdesk://file-transfer/${device.id}`, "_self")}
          disabled={!isOnline}
          className="rd2-btn"
          style={isOnline ? { background: "#0E1116", color: "#FFFFFF", border: "none" } : { opacity: 0.5 }}
        >
          <FolderUp width="14" height="14" /> Dosya Transferi
        </button>

        <button 
          onClick={() => window.open(`rustdesk://terminal/${device.id}?password=${connSettings.defaultPassword}&host=${connSettings.host}`, "_self")}
          disabled={!isOnline}
          className="rd2-btn"
          style={isOnline ? { background: "#0E1116", color: "#FFFFFF", border: "none" } : { opacity: 0.5 }}
        >
          <Terminal width="14" height="14" /> Native Terminal
        </button>

        <div style={{ width: 1, height: 24, background: "var(--line)", margin: "0 4px" }} />

        <button 
          onClick={() => runAction("restart")}
          disabled={!isOnline}
          className="rd2-btn rd2-btn-sm"
          style={isOnline ? { background: "#F1F2F4" } : { opacity: 0.5 }}
        >
          <RotateCcw width="13" height="13" /> {actionStatus.restart === "running" ? "Bekleyin..." : "Yeniden Başlat"}
        </button>

        <button 
          onClick={() => runAction("shutdown")}
          disabled={!isOnline}
          className="rd2-btn rd2-btn-sm"
          style={isOnline ? { background: "#FCEAEA", color: "#C0392B" } : { opacity: 0.5 }}
        >
          <Power width="13" height="13" /> Kapat
        </button>

        <button 
          onClick={() => runAction("lock")}
          disabled={!isOnline}
          className="rd2-btn rd2-btn-sm"
          style={isOnline ? { background: "#F1F2F4" } : { opacity: 0.5 }}
        >
          <Lock width="13" height="13" /> Kilitle
        </button>

        <button 
          onClick={() => { fetchDevices(); setActionStatus(prev => ({ ...prev, refresh: "success" })); }}
          className="rd2-icon-btn rd2-icon-btn-sm"
          style={{ marginLeft: "auto" }}
        >
          <RefreshCw width="14" height="14" className={actionStatus.refresh === "running" ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border mb-6 px-2">
        <button 
          onClick={() => setActiveTab("overview")} 
          className={`pb-3 text-[15px] font-bold transition-all relative ${activeTab === 'overview' ? 'text-brand-yellow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Özet
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-yellow rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab("networks")} 
          className={`pb-3 text-[15px] font-bold transition-all relative ${activeTab === 'networks' ? 'text-brand-yellow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Ağlar
          {activeTab === 'networks' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-yellow rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab("terminal")} 
          className={`pb-3 text-[15px] font-bold transition-all relative ${activeTab === 'terminal' ? 'text-brand-yellow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Command Queue (Terminal)
          {activeTab === 'terminal' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-yellow rounded-t-full"></div>}
        </button>
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* Cihaz Özeti (Sol) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border-2 border-border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted px-4 py-3 border-b border-border">
                <h3 className="font-black text-sm uppercase tracking-wider">Cihaz Özeti</h3>
              </div>
              <div className="p-0">
                <table className="w-full text-[13px]">
                  <tbody>
                    <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground w-1/3">İsim</td><td className="py-2 px-4">{device.name || "-"}</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">Giriş Yapmış K.</td><td className="py-2 px-4">{device.user || "-"}</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">AD/LDAP Domain</td><td className="py-2 px-4">{device.adDomain || "-"}</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">Biçim Katsayısı</td><td className="py-2 px-4">{device.formFactor || "-"}</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">Model</td><td className="py-2 px-4">{device.model || "-"}</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">İşlemci</td><td className="py-2 px-4">{device.processor || device.cpu || "-"}</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">Seri Numarası</td><td className="py-2 px-4">{device.serialNumber || "-"}</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">Sistem Üreticisi</td><td className="py-2 px-4">{device.manufacturer || "-"}</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">Ajan Sürümü</td><td className="py-2 px-4">{device.agentVersion || "Bilinmiyor"}</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">Son Bağlantı</td><td className="py-2 px-4">{device.lastSeen || "-"}</td></tr>
                    <tr><td className="py-2 px-4 font-bold text-muted-foreground">Dış IP</td><td className="py-2 px-4 text-emerald-500 font-bold">{(device.ip || "-").replace(/^::ffff:/, "")}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Orta & Sağ Kolon */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Üst Kısım: Thumbnail + OS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border-2 border-border rounded-xl overflow-hidden shadow-sm flex flex-col items-center justify-center min-h-[220px] p-6 text-center">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <Monitor className="w-12 h-12 text-muted-foreground/30" />
                </div>
                <h3 className="font-bold text-foreground">Desktop Thumbnail</h3>
                <p className="text-[12px] text-muted-foreground mt-1">Görüntü önizlemesi şu an desteklenmiyor.</p>
              </div>

              <div className="bg-card border-2 border-border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-muted px-4 py-3 border-b border-border">
                  <h3 className="font-black text-sm uppercase tracking-wider">İşletim Sistemi Özeti</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-[13px]">
                    <tbody>
                      <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground w-2/5">OS</td><td className="py-2 px-4">{device.os || "-"}</td></tr>
                      <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">OS Adı</td><td className="py-2 px-4">{device.osName || device.os || "-"}</td></tr>
                      <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">İşletim Sistemi Tam Sürüm</td><td className="py-2 px-4">{device.osBuild || "-"}</td></tr>
                      <tr className="border-b border-border/50"><td className="py-2 px-4 font-bold text-muted-foreground">Hizmet Paketi</td><td className="py-2 px-4">YOK</td></tr>
                      <tr><td className="py-2 px-4 font-bold text-muted-foreground">Yeniden Başlatma Süresi</td><td className="py-2 px-4">{device.bootTime || "-"}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Alt Kısım: Performans */}
            <div className="bg-card border-2 border-border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted px-4 py-3 border-b border-border">
                <h3 className="font-black text-sm uppercase tracking-wider">Performans Metrikleri</h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-muted-foreground">CPU KULLANIMI</span>
                  <div className="text-xl font-black text-foreground flex items-end gap-2">
                    {device.cpu ? "2%" : "-"} <span className="text-[11px] text-muted-foreground font-medium pb-1">({device.processor || "-"})</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-muted-foreground">RAM KULLANIMI</span>
                  <div className="text-xl font-black text-foreground flex items-end gap-2">
                    {device.ram || "-"} <span className="text-[11px] text-muted-foreground font-medium pb-1"></span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-muted-foreground">DİSK</span>
                  <div className="text-xl font-black text-foreground flex items-end gap-2">
                    {device.disk || "-"} <span className="text-[11px] text-muted-foreground font-medium pb-1">Boş</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Content: NETWORKS */}
      {activeTab === "networks" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {netDetails.length === 0 ? (
            <div className="bg-card border-2 border-border border-dashed rounded-xl p-10 text-center flex flex-col items-center">
               <Network className="w-12 h-12 text-muted-foreground/30 mb-4" />
               <p className="text-muted-foreground font-bold">Ağ bilgisi bulunamadı.</p>
               <p className="text-[12px] text-muted-foreground mt-1">Ajanın veri göndermesi bekleniyor.</p>
            </div>
          ) : (
            netDetails.map((net: any, idx: number) => (
              <div key={idx} className="bg-card border-2 border-border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-muted px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-black text-sm uppercase tracking-wider">Cihaz Ağı №{idx + 1}</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-[13px]">
                    <tbody>
                      <tr className="border-b border-border/50"><td className="py-3 px-4 font-bold text-muted-foreground w-1/4">İsim</td><td className="py-3 px-4 font-medium">{net.name || "-"}</td></tr>
                      <tr className="border-b border-border/50"><td className="py-3 px-4 font-bold text-muted-foreground">IP</td><td className="py-3 px-4 text-emerald-500 font-bold">{net.ip || "-"}</td></tr>
                      <tr className="border-b border-border/50"><td className="py-3 px-4 font-bold text-muted-foreground">Alt Ağ</td><td className="py-3 px-4 rd2-mono text-[12px]">{net.mask || "-"}</td></tr>
                      <tr className="border-b border-border/50"><td className="py-3 px-4 font-bold text-muted-foreground">Ağ Geçidi</td><td className="py-3 px-4 rd2-mono text-[12px]">{net.gw || "YOK"}</td></tr>
                      <tr className="border-b border-border/50"><td className="py-3 px-4 font-bold text-muted-foreground">MAC Adresi</td><td className="py-3 px-4 rd2-mono text-[12px] uppercase">{net.mac || "-"}</td></tr>
                      <tr><td className="py-3 px-4 font-bold text-muted-foreground">Bağlantı Hızı</td><td className="py-3 px-4">{net.speed ? `${net.speed} Mbit/s` : "0 Mbit/s"}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: TERMINAL */}
      {activeTab === "terminal" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="rd2-terminal h-[600px] flex flex-col">
            <div className="rd2-term-header shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-yellow" />
                <span className="text-white text-[12px] font-bold">Command Queue</span>
                <span className="rd2-term-badge">PowerShell</span>
              </div>
            </div>
            <div className="rd2-term-body bg-brand-ink/95 flex-1 overflow-y-auto" ref={terminalRef}>
              <div className="rd2-term-comment"># RustDesk Remote Command Queue — {device.name}</div>
              {terminalHistory.map((e, i) => (
                <div key={i} className="mt-3">
                  <div className="flex gap-2">
                    <span className="opacity-30">PS {">"}</span>
                    <span className="text-brand-yellow">{e.cmd}</span>
                  </div>
                  <pre className="mt-1 text-[11px] text-emerald-400 opacity-80 whitespace-pre-wrap">{e.output}</pre>
                </div>
              ))}
              <span className="text-emerald-500 animate-pulse">_</span>
            </div>
            <form 
              className="rd2-term-input shrink-0" 
              onSubmit={(e) => {
                e.preventDefault();
                if (!terminalInput.trim()) return;
                runAction("terminal", terminalInput.trim());
                setTerminalInput("");
              }}
            >
              <input 
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Powershell komutu girin..." 
                disabled={!isOnline}
              />
              <button 
                type="submit" 
                className="bg-brand-yellow text-brand-ink px-6 font-black uppercase text-[13px] disabled:opacity-50"
                disabled={!isOnline || !terminalInput.trim()}
              >
                <Send className="w-4 h-4 mr-2 inline-block" /> Gönder
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
