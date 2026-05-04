"use client";

import { useAppStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { 
  Monitor, Cpu, Database, HardDrive, Activity, 
  ArrowLeft, Play, Shield, Calendar, Clock, 
  User as UserIcon, Globe, Laptop, Server,
  RotateCcw, Power, Lock, Terminal, FileText, Send, RefreshCw,
  FolderUp, AlertTriangle, CheckCircle2, Loader2, ChevronLeft
} from "lucide-react";
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
  const terminalRef = useRef<HTMLDivElement>(null);

  const [connSettings, setConnSettings] = useState({ host: "", serverKey: "", defaultPassword: "" });

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

  const handleConnect = () => {
    if (!device) return;
    const cleanId = String(device.id).replace(/\s+/g, "");
    const { host, serverKey, defaultPassword } = connSettings;
    
    const url = serverKey
      ? `rustdesk://${cleanId}?password=${defaultPassword}&host=${host}&key=${encodeURIComponent(serverKey)}`
      : `rustdesk://${cleanId}?password=${defaultPassword}&host=${host}`;
    
    window.open(url, "_self");
  };

  const runAction = async (action: string, command?: string) => {
    if (!device) return;
    setActionStatus(prev => ({ ...prev, [action]: "running" }));

    try {
      const res = await fetch("/api/rustdesk/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.id, action, command: command || "" })
      });
      const data = await res.json();
      
      if (action === "terminal" && command) {
        setTerminalHistory(prev => [...prev, { cmd: command, output: "Yanıt bekleniyor...", status: "idle" }]);
      }
      
      setActionStatus(prev => ({ ...prev, [action]: data.success ? "success" : "error" }));
      setTimeout(() => setActionStatus(prev => ({ ...prev, [action]: "idle" })), 3000);
    } catch (error) {
      setActionStatus(prev => ({ ...prev, [action]: "error" }));
    }
  };

  if (!mounted || !device) return null;

  const isOnline = device.status === "online";

  return (
    <div className="rd2-page max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="rd2-detail-header">
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
      <div className="rd2-card rd2-action-bar">
        <button 
          onClick={handleConnect}
          disabled={!isOnline}
          className="rd2-action-btn bg-brand-yellow text-brand-ink"
        >
          <Play className="w-4 h-4 fill-current" /> Uzaktan Bağlan
        </button>
        <button 
          onClick={() => window.open(`rustdesk://file-transfer/${device.id}`, "_self")}
          disabled={!isOnline}
          className="rd2-action-btn bg-blue-600 text-white"
        >
          <FolderUp className="w-4 h-4" /> Dosya
        </button>
        <button 
          onClick={() => runAction("restart")}
          disabled={!isOnline}
          className="rd2-action-btn bg-orange-500 text-white"
        >
          <RotateCcw className="w-4 h-4" /> Yeniden Başlat
        </button>
        <button 
          onClick={() => runAction("shutdown")}
          disabled={!isOnline}
          className="rd2-action-btn bg-red-500 text-white"
        >
          <Power className="w-4 h-4" /> Kapat
        </button>
        <button 
          onClick={() => runAction("lock")}
          disabled={!isOnline}
          className="rd2-action-btn bg-violet-500 text-white"
        >
          <Lock className="w-4 h-4" /> Kilitle
        </button>
        <button 
          onClick={() => { fetchDevices(); setActionStatus(prev => ({ ...prev, refresh: "success" })); }}
          className="rd2-action-btn bg-secondary text-muted-foreground ml-auto"
        >
          <RefreshCw className={`w-4 h-4 ${actionStatus.refresh === "running" ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="rd2-detail-grid">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Stats Grid */}
          <div className="rd2-stats-grid rd2-stats-2">
            {[
              { label: "CPU", val: device.cpu || "-", icon: Cpu, bg: "bg-blue-50", color: "text-blue-600" },
              { label: "RAM", val: device.ram || "-", icon: Database, bg: "bg-purple-50", color: "text-purple-600" },
              { label: "Disk", val: device.disk || "-", icon: HardDrive, bg: "bg-amber-50", color: "text-amber-600" },
              { label: "IP", val: (device.ip || "-").replace(/^::ffff:/, ""), icon: Globe, bg: "bg-emerald-50", color: "text-emerald-600" },
            ].map(s => (
              <div key={s.label} className="rd2-stat">
                <div className={`rd2-stat-icon ${s.bg} ${s.color}`}>
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <div className="rd2-stat-val !text-[15px] !mt-2">{s.val}</div>
                <div className="rd2-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Terminal */}
          <div className="rd2-terminal">
            <div className="rd2-term-header">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-yellow" />
                <span className="text-white text-[12px] font-bold">Uzak Terminal</span>
                <span className="rd2-term-badge">PowerShell</span>
              </div>
            </div>
            <div className="rd2-term-body bg-brand-ink/95" ref={terminalRef}>
              <div className="rd2-term-comment"># RustDesk Remote Terminal — {device.name}</div>
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
              className="rd2-term-input" 
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
                placeholder="Komut girin..." 
                disabled={!isOnline}
              />
              <button 
                type="submit" 
                className="bg-brand-yellow text-brand-ink px-4 font-bold text-[13px] disabled:opacity-50"
                disabled={!isOnline || !terminalInput.trim()}
              >
                <Send className="w-4 h-4 mr-2" /> Çalıştır
              </button>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {/* System Info */}
          <section className="rd2-card">
            <div className="rd2-card-head !mb-3">
              <h3>Sistem Bilgileri</h3>
            </div>
            {[
              { label: "OS", val: device.os },
              { label: "User", val: device.user },
              { label: "Last Seen", val: device.lastSeen },
              { label: "Version", val: device.version || "1.4.x" },
            ].map(r => (
              <div key={r.label} className="rd2-info-row">
                <span className="rd2-info-label">{r.label}</span>
                <span className="rd2-info-val">{r.val}</span>
              </div>
            ))}
          </section>

          {/* Network Info */}
          <section className="rd2-card">
            <div className="rd2-card-head !mb-3">
              <h3>Ağ Detayları</h3>
            </div>
            {[
              { label: "IP", val: (device.ip || "-").replace(/^::ffff:/, "") },
              { label: "Gateway", val: device.gateway || "-" },
              { label: "DNS", val: device.dns || "-" },
            ].map(r => (
              <div key={r.label} className="rd2-info-row">
                <span className="rd2-info-label">{r.label}</span>
                <span className="rd2-info-val rd2-mono !text-[11px]">{r.val}</span>
              </div>
            ))}
          </section>

          {/* Security Badge */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-[12px] flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div className="text-[12px] font-bold text-emerald-700">AES-256 Güvenli Bağlantı</div>
              <div className="text-[10px] text-emerald-600/60 font-black tracking-widest uppercase">Uçtan Uca Şifreli</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
