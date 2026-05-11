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
    <div className="rd2-page" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div className="rd2-detail-header" style={{ marginBottom: 24 }}>
        <button className="rd2-back-btn" onClick={() => router.back()}>
          <ChevronLeft width="20" height="20" />
        </button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 className="rd2-h1" style={{ margin: 0 }}>{device.name}</h2>
            <span className={`rd2-pill ${isOnline ? "rd2-pill-on" : "rd2-pill-off"}`}>
              <span className={`rd2-dot ${isOnline ? "rd2-dot-green rd2-pulse" : "rd2-dot-gray"}`} />
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <div className="rd2-mono rd2-muted-sm" style={{ marginTop: 4 }}>ID: {device.id} · {device.os} · {device.user}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="rd2-card rd2-action-bar" style={{ marginBottom: 24 }}>
        <button 
          onClick={handleConnect}
          disabled={!isOnline}
          className="rd2-btn"
          style={isOnline ? { background: "#FFCC00", color: "#0E1116", border: "1px solid rgba(14,17,22,.08)" } : { opacity: 0.5 }}
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
          style={isOnline ? { background: "var(--gray-bg)" } : { opacity: 0.5 }}
        >
          <RotateCcw width="13" height="13" /> {actionStatus.restart === "running" ? "Bekleyin..." : "Yeniden Başlat"}
        </button>

        <button 
          onClick={() => runAction("shutdown")}
          disabled={!isOnline}
          className="rd2-btn rd2-btn-sm"
          style={isOnline ? { background: "var(--red-bg)", color: "var(--red)" } : { opacity: 0.5 }}
        >
          <Power width="13" height="13" /> Kapat
        </button>

        <button 
          onClick={() => runAction("lock")}
          disabled={!isOnline}
          className="rd2-btn rd2-btn-sm"
          style={isOnline ? { background: "var(--gray-bg)" } : { opacity: 0.5 }}
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
      <div className="rd2-tabs" style={{ marginBottom: 24, borderColor: "var(--line)" }}>
        <button 
          onClick={() => setActiveTab("overview")} 
          className={`rd2-tab ${activeTab === 'overview' ? 'on' : ''}`}
          style={activeTab === 'overview' ? { borderBottomColor: '#FFCC00', color: 'var(--text)' } : {}}
        >
          Özet
        </button>
        <button 
          onClick={() => setActiveTab("networks")} 
          className={`rd2-tab ${activeTab === 'networks' ? 'on' : ''}`}
          style={activeTab === 'networks' ? { borderBottomColor: '#FFCC00', color: 'var(--text)' } : {}}
        >
          Ağlar
        </button>
        <button 
          onClick={() => setActiveTab("terminal")} 
          className={`rd2-tab ${activeTab === 'terminal' ? 'on' : ''}`}
          style={activeTab === 'terminal' ? { borderBottomColor: '#FFCC00', color: 'var(--text)' } : {}}
        >
          Command Queue (Terminal)
        </button>
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="rd2-detail-grid">
          
          {/* Cihaz Özeti (Sol) */}
          <div className="rd2-card rd2-card-flush" style={{ alignSelf: "start" }}>
            <div style={{ background: "var(--gray-bg)", padding: "12px 16px", borderBottom: "1px solid var(--line2)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>Cihaz Özeti</h3>
            </div>
            <div style={{ padding: "8px 16px 16px" }}>
              <div className="rd2-info-row"><span className="rd2-info-label">İsim</span><span className="rd2-info-val">{device.name || "-"}</span></div>
              <div className="rd2-info-row"><span className="rd2-info-label">Giriş Yapmış K.</span><span className="rd2-info-val">{device.user || "-"}</span></div>
              <div className="rd2-info-row"><span className="rd2-info-label">AD/LDAP Domain</span><span className="rd2-info-val">{device.adDomain || "-"}</span></div>
              <div className="rd2-info-row"><span className="rd2-info-label">Biçim Katsayısı</span><span className="rd2-info-val">{device.formFactor || "-"}</span></div>
              <div className="rd2-info-row"><span className="rd2-info-label">Model</span><span className="rd2-info-val">{device.model || "-"}</span></div>
              <div className="rd2-info-row"><span className="rd2-info-label">İşlemci</span><span className="rd2-info-val">{device.processor || device.cpu || "-"}</span></div>
              <div className="rd2-info-row"><span className="rd2-info-label">Seri Numarası</span><span className="rd2-info-val">{device.serialNumber || "-"}</span></div>
              <div className="rd2-info-row"><span className="rd2-info-label">Sistem Üreticisi</span><span className="rd2-info-val">{device.manufacturer || "-"}</span></div>
              <div className="rd2-info-row"><span className="rd2-info-label">Ajan Sürümü</span><span className="rd2-info-val">{device.agentVersion || "Bilinmiyor"}</span></div>
              <div className="rd2-info-row"><span className="rd2-info-label">Son Bağlantı</span><span className="rd2-info-val">{device.lastSeen || "-"}</span></div>
              <div className="rd2-info-row"><span className="rd2-info-label">Dış IP</span><span className="rd2-info-val" style={{ color: "var(--green)" }}>{(device.ip || "-").replace(/^::ffff:/, "")}</span></div>
            </div>
          </div>

          {/* Orta & Sağ Kolon */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div className="rd2-2col">
              <div className="rd2-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "200px" }}>
                <div style={{ padding: "16px", background: "var(--gray-bg)", borderRadius: "50%", marginBottom: "16px" }}>
                  <Monitor style={{ width: 40, height: 40, color: "var(--muted2)" }} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 800 }}>Desktop Thumbnail</h3>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Görüntü önizlemesi şu an desteklenmiyor.</p>
              </div>

              <div className="rd2-card rd2-card-flush">
                <div style={{ background: "var(--gray-bg)", padding: "12px 16px", borderBottom: "1px solid var(--line2)" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>İşletim Sistemi Özeti</h3>
                </div>
                <div style={{ padding: "8px 16px 16px" }}>
                  <div className="rd2-info-row"><span className="rd2-info-label">OS</span><span className="rd2-info-val">{device.os || "-"}</span></div>
                  <div className="rd2-info-row"><span className="rd2-info-label">OS Adı</span><span className="rd2-info-val">{device.osName || device.os || "-"}</span></div>
                  <div className="rd2-info-row"><span className="rd2-info-label">Tam Sürüm</span><span className="rd2-info-val">{device.osBuild || "-"}</span></div>
                  <div className="rd2-info-row"><span className="rd2-info-label">Hizmet Paketi</span><span className="rd2-info-val">YOK</span></div>
                  <div className="rd2-info-row"><span className="rd2-info-label">Boot Time</span><span className="rd2-info-val">{device.bootTime || "-"}</span></div>
                </div>
              </div>
            </div>

            <div className="rd2-card rd2-card-flush">
              <div style={{ background: "var(--gray-bg)", padding: "12px 16px", borderBottom: "1px solid var(--line2)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>Performans Metrikleri</h3>
              </div>
              <div className="rd2-stats-grid rd2-stats-3" style={{ padding: "16px", gap: "16px" }}>
                <div className="rd2-stat rd2-stat-mini" style={{ boxShadow: "none", border: "1px solid var(--line)" }}>
                  <div className="rd2-stat-label">CPU KULLANIMI</div>
                  <div className="rd2-stat-val" style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    {device.cpu ? "2%" : "-"} <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>({device.processor || "-"})</span>
                  </div>
                </div>
                <div className="rd2-stat rd2-stat-mini" style={{ boxShadow: "none", border: "1px solid var(--line)" }}>
                  <div className="rd2-stat-label">RAM KULLANIMI</div>
                  <div className="rd2-stat-val" style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    {device.ram || "-"}
                  </div>
                </div>
                <div className="rd2-stat rd2-stat-mini" style={{ boxShadow: "none", border: "1px solid var(--line)" }}>
                  <div className="rd2-stat-label">DİSK</div>
                  <div className="rd2-stat-val" style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    {device.disk || "-"} <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Boş</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Content: NETWORKS */}
      {activeTab === "networks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {netDetails.length === 0 ? (
            <div className="rd2-card" style={{ padding: "40px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", borderStyle: "dashed", borderColor: "var(--line)" }}>
               <Network style={{ width: 48, height: 48, color: "var(--muted2)", marginBottom: 16 }} />
               <h3 style={{ fontSize: 15, fontWeight: 800 }}>Ağ bilgisi bulunamadı</h3>
               <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Ajanın veri göndermesi bekleniyor.</p>
            </div>
          ) : (
            <div className="rd2-2col">
              {netDetails.map((net: any, idx: number) => (
                <div key={idx} className="rd2-card rd2-card-flush">
                  <div style={{ background: "var(--gray-bg)", padding: "12px 16px", borderBottom: "1px solid var(--line2)" }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>Ağ Bağdaştırıcısı #{idx + 1}</h3>
                  </div>
                  <div style={{ padding: "8px 16px 16px" }}>
                    <div className="rd2-info-row"><span className="rd2-info-label">İsim</span><span className="rd2-info-val" style={{ textAlign: "left", flex: 1, marginLeft: 16 }}>{net.name || "-"}</span></div>
                    <div className="rd2-info-row"><span className="rd2-info-label">IP Adresi</span><span className="rd2-info-val" style={{ color: "var(--green)" }}>{net.ip || "-"}</span></div>
                    <div className="rd2-info-row"><span className="rd2-info-label">Alt Ağ</span><span className="rd2-info-val rd2-mono">{net.mask || "-"}</span></div>
                    <div className="rd2-info-row"><span className="rd2-info-label">Ağ Geçidi</span><span className="rd2-info-val rd2-mono">{net.gw || "YOK"}</span></div>
                    <div className="rd2-info-row"><span className="rd2-info-label">MAC Adresi</span><span className="rd2-info-val rd2-mono">{net.mac || "-"}</span></div>
                    <div className="rd2-info-row"><span className="rd2-info-label">Bağlantı Hızı</span><span className="rd2-info-val">{net.speed ? `${net.speed} Mbit/s` : "0 Mbit/s"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: TERMINAL */}
      {activeTab === "terminal" && (
        <div>
           <div className="rd2-terminal" style={{ height: "600px", display: "flex", flexDirection: "column" }}>
            <div className="rd2-term-header" style={{ flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Terminal style={{ width: 16, height: 16, color: "#FFCC00" }} />
                <span style={{ color: "#FFF", fontSize: 12, fontWeight: 800 }}>Command Queue</span>
                <span className="rd2-term-badge">PowerShell</span>
              </div>
            </div>
            <div className="rd2-term-body" style={{ flex: 1 }} ref={terminalRef}>
              <div className="rd2-term-comment"># RustDesk Remote Command Queue — {device.name}</div>
              {terminalHistory.map((e, i) => (
                <div key={i} style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ opacity: 0.3 }}>PS {">"}</span>
                    <span style={{ color: "#FFCC00" }}>{e.cmd}</span>
                  </div>
                  <pre style={{ marginTop: 4, fontSize: 11, color: "#34d399", opacity: 0.8, whiteSpace: "pre-wrap" }}>{e.output}</pre>
                </div>
              ))}
              <span style={{ color: "#34d399", animation: "rd2-pulse 1s infinite" }}>_</span>
            </div>
            <form 
              className="rd2-term-input" 
              style={{ flexShrink: 0 }}
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
                style={{ background: "#FFCC00", color: "#0E1116", padding: "0 24px", fontWeight: 900, textTransform: "uppercase", fontSize: 13, border: "none", cursor: "pointer", opacity: (!isOnline || !terminalInput.trim()) ? 0.5 : 1 }}
                disabled={!isOnline || !terminalInput.trim()}
              >
                <Send width="16" height="16" style={{ marginRight: 8, display: "inline-block", verticalAlign: "middle" }} /> Gönder
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
