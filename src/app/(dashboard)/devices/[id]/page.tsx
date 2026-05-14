"use client";

import { useAppStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import {
  Play, Lock,
  RotateCcw, Power, RefreshCw, Terminal,
  FolderUp, Loader2, ChevronLeft,
  Network, Wifi, WifiOff,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { devices, fetchDevices } = useAppStore();

  const [mounted,      setMounted]      = useState(false);
  const [wsConnected,  setWsConnected]  = useState(false);
  const [liveStatus,   setLiveStatus]   = useState<"online" | "offline" | null>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<Record<string, any>>({});

  const [actionStatus,    setActionStatus]    = useState<Record<string, "idle" | "running" | "success" | "error">>({});

  const [connSettings, setConnSettings] = useState({ host: "", defaultPassword: "Ban41kam5" });
  const socketRef  = useRef<Socket | null>(null);

  // ── Mount + settings ───────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    fetchDevices();
    fetch("/api/rustdesk/settings")
      .then(r => r.json())
      .then(d => setConnSettings({ 
        host: d.idServer || d.host || "", 
        defaultPassword: "Ban41kam5" // Kullanıcı isteği üzerine sabitlendi
      }))
      .catch(() => {});
  }, [fetchDevices]);

  const device = devices.find(d => d.id === params.id);

  // ── Socket.IO — device-specific ────────────────────────────────────
  useEffect(() => {
    if (!device?.id) return;

    const socket = io({
      query: { deviceId: device.id, type: "dashboard" },
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      socket.emit("get_agent_status", { deviceId: device.id });
    });

    socket.on("agent_status", (data: { deviceId: string; wsConnected: boolean }) => {
      if (data.deviceId === device.id) setWsConnected(data.wsConnected);
    });

    socket.on("device_status", (data: { deviceId: string; status: "online" | "offline"; wsConnected?: boolean }) => {
      if (data.deviceId === device.id) {
        setLiveStatus(data.status);
        if (data.wsConnected !== undefined) setWsConnected(data.wsConnected);
      }
    });

    socket.on("telemetry_update", (data: { deviceId: string; data: Record<string, any> }) => {
      if (data.deviceId === device.id) {
        setLiveTelemetry(prev => ({ ...prev, ...data.data }));
      }
    });

    socket.on("device_removed", (data: { deviceId: string }) => {
      if (data.deviceId === device.id) {
        console.warn("[SOCKET] Current device removed by deduplication. Redirecting...");
        router.push("/devices");
      }
    });

    socketRef.current = socket;
    return () => { 
      socket.off("connect");
      socket.off("agent_status");
      socket.off("device_status");
      socket.off("telemetry_update");
      socket.off("device_removed");
      socket.disconnect(); 
      socketRef.current = null; 
    };
  }, [device?.id, params.id]);

  // ── Actions ────────────────────────────────────────────────────────
  const runAction = (action: string, command?: string) => {
    if (!device || !socketRef.current) return;
    setActionStatus(prev => ({ ...prev, [action]: "running" }));

    socketRef.current.emit("send_command", { deviceId: device.id, action, command: command || "" });

    setTimeout(() => {
      setActionStatus(prev => ({ ...prev, [action]: "success" }));
      setTimeout(() => {
        setActionStatus(prev => ({ ...prev, [action]: "idle" }));
      }, 3000);
    }, 2000);
  };

  const handleConnect = () => {
    if (!device) return;
    const id  = String(device.id).replace(/\s+/g, "");
    const url = `rustdesk://${id}?password=${connSettings.defaultPassword}&host=${connSettings.host}`;
    window.open(url, "_self");
  };

  const handleFileTransfer = () => {
    if (!device) return;
    const id  = String(device.id).replace(/\s+/g, "");
    const url = `rustdesk://file-transfer/${id}?password=${connSettings.defaultPassword}&host=${connSettings.host}`;
    window.open(url, "_self");
  };

  // ── Merged display values (live overrides stored data) ─────────────
  const get = (key: string) => (liveTelemetry[key] ?? (device as any)?.[key]) || "-";

  if (!mounted || !device) return null;

  const isOnline = liveStatus ?? device.status === "online" ? "online" : "offline";
  const online   = isOnline === "online";
  const netDetails: any[] = Array.isArray(liveTelemetry.net_details)
    ? liveTelemetry.net_details
    : (Array.isArray(device.net_details) ? device.net_details : []);

  return (
    <div className="rd2-page" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="rd2-detail-header" style={{ marginBottom: 24 }}>
        <button className="rd2-back-btn" onClick={() => router.back()}>
          <ChevronLeft width={20} height={20} />
        </button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 className="rd2-h1" style={{ margin: 0 }}>{device.name}</h2>
            <span className={`rd2-pill ${online ? "rd2-pill-on" : "rd2-pill-off"}`}>
              <span className={`rd2-dot ${online ? "rd2-dot-green rd2-pulse" : "rd2-dot-gray"}`} />
              {online ? "Online" : "Offline"}
            </span>
            <span
              title={wsConnected ? "Agent WebSocket ile canlı bağlı" : "Agent WS bağlantısı yok"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700, letterSpacing: ".04em",
                padding: "3px 10px", borderRadius: 20,
                background: wsConnected ? "#E8F7EE" : "#F1F2F4",
                color:      wsConnected ? "#1A8245" : "#8B92A0",
              }}
            >
              {wsConnected
                ? <><Wifi width={11} height={11} /> WS Canlı</>
                : <><WifiOff width={11} height={11} /> WS Yok</>}
            </span>
          </div>
          <div className="rd2-mono rd2-muted-sm" style={{ marginTop: 4 }}>
            ID: {device.id} · {get("os")} · {get("user") !== "-" ? get("user") : device.user}
          </div>
        </div>
      </div>

      {/* ── Action Bar ─────────────────────────────────────────────── */}
      <div className="rd2-card rd2-action-bar" style={{ 
        marginBottom: 24, 
        display: "flex", 
        flexDirection: "row",
        alignItems: "stretch",
        gap: 8, 
        padding: 12,
        overflowX: "auto",
        whiteSpace: "nowrap",
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(10px)",
        border: "1px solid var(--line)"
      }}>
        <button onClick={handleConnect} disabled={!online} className="rd2-btn"
          style={{ 
            background: online ? "#FFCC00" : "#F1F2F4", 
            color: "#0E1116", 
            flex: 1, height: 50, fontWeight: 800, fontSize: 13, border: "none",
            boxShadow: online ? "0 4px 12px rgba(255, 204, 0, 0.2)" : "none"
          }}>
          <Play width={16} height={16} /> Bağlan
        </button>

        <button onClick={handleFileTransfer} disabled={!online} className="rd2-btn"
          style={{ 
            background: "#0E1116", color: "#fff", flex: 1, height: 50, fontWeight: 700, fontSize: 13, 
            border: "1px solid rgba(255,255,255,0.1)", opacity: online ? 1 : 0.5 
          }}>
          <FolderUp width={16} height={16} /> Dosya
        </button>

        <button onClick={() => window.open(`rustdesk://terminal/${device.id}?password=${connSettings.defaultPassword}&host=${connSettings.host}`, "_self")}
          disabled={!online} className="rd2-btn"
          style={{ 
            background: "#0E1116", color: "#fff", flex: 1, height: 50, fontWeight: 700, fontSize: 13, 
            border: "1px solid rgba(255,255,255,0.1)", opacity: online ? 1 : 0.5 
          }}>
          <Terminal width={16} height={16} /> Terminal
        </button>

        <button onClick={() => runAction("update")} disabled={!online} className="rd2-btn"
          style={{ 
            background: "#0E1116", color: "#fff", flex: 1, height: 50, fontWeight: 700, fontSize: 13, 
            border: "1px solid rgba(255,255,255,0.1)", opacity: online ? 1 : 0.5 
          }}>
          {actionStatus.update === "running" ? <Loader2 width={16} height={16} className="animate-spin" /> : <RefreshCw width={16} height={16} />}
          {actionStatus.update === "success" ? "Güncellendi" : "Güncelle"}
        </button>

        <button onClick={() => runAction("restart")} disabled={!online} className="rd2-btn"
          style={{ 
            background: "#0E1116", color: "#fff", flex: 1, height: 50, fontWeight: 700, fontSize: 13, 
            border: "1px solid rgba(255,255,255,0.1)", opacity: online ? 1 : 0.5 
          }}>
          {actionStatus.restart === "running" ? <Loader2 width={16} height={16} className="animate-spin" /> : <RotateCcw width={16} height={16} />}
          Reset
        </button>

        <button onClick={() => runAction("lock")} disabled={!online} className="rd2-btn"
          style={{ 
            background: "#0E1116", color: "#fff", flex: 1, height: 50, fontWeight: 700, fontSize: 13, 
            border: "1px solid rgba(255,255,255,0.1)", opacity: online ? 1 : 0.5 
          }}>
          <Lock width={16} height={16} /> Kilitle
        </button>

        <button onClick={() => runAction("shutdown")} disabled={!online} className="rd2-btn"
          style={{ 
            background: online ? "#DC2626" : "#F1F2F4", 
            color: "#fff", flex: 1, height: 50, fontWeight: 700, fontSize: 13, border: "none"
          }}>
          <Power width={16} height={16} /> Kapat
        </button>
      </div>

      {/* ── Main Content Grid ──────────────────────────────────────── */}
      <div className="rd2-detail-grid">

        {/* Sol Kolon: Cihaz ve Donanım Özeti */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="rd2-card rd2-card-flush">
            <div style={{ background: "var(--gray-bg)", padding: "12px 16px", borderBottom: "1px solid var(--line2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>Cihaz Bilgileri</h3>
              <button onClick={() => fetchDevices()} className="rd2-muted-sm" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <RefreshCw width={12} height={12} />
              </button>
            </div>
            <div style={{ padding: "8px 16px 16px" }}>
              {[
                ["İsim",             get("hostname") !== "-" ? get("hostname") : device.name],
                ["Giriş Yapmış Kullanıcı",  get("user")],
                ["Anlık CPU / RAM",  get("cpuUsage") !== "-" ? `${get("cpuUsage")}% / ${get("ramUsage")}%` : "Yükleniyor..."],
                ["Windows Update",   get("pendingUpdates") === "0" ? "Güncel" : (get("pendingUpdates") === "Hata" ? "Kontrol Edilemedi" : `${get("pendingUpdates")} Eksik Yama`)],
                ["İşlemci",          get("processor")],
                ["Bellek (RAM)",     get("ram")],
                ["Disk Durumu",      get("disk")],
                ["Seri Numarası",    get("serialNumber")],
                ["Üretici",          get("manufacturer")],
                ["Model",            get("model")],
                ["İşletim Sistemi",  get("osName")],
                ["OS Derleme",       get("osBuild")],
                ["Ajan Sürümü",      get("agentVersion")],
                ["Boot Time",        get("bootTime")],
                ["IP Adresi",        get("ip")],
                ["Son Görülme",      device.lastSeen],
              ].map(([label, value]) => (
                <div key={label as string} className="rd2-info-row">
                  <span className="rd2-info-label">{label}</span>
                  <span className="rd2-info-val" style={label === "IP Adresi" ? { color: "var(--green)" } : {}}>
                    {String(value || "-").replace(/^::ffff:/, "")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Ağ Detayları */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="rd2-card rd2-card-flush">
            <div style={{ background: "var(--gray-bg)", padding: "12px 16px", borderBottom: "1px solid var(--line2)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>Ağ Bağdaştırıcıları</h3>
            </div>
            <div style={{ padding: 16 }}>
              {netDetails.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)" }}>
                   <Network style={{ width: 32, height: 32, opacity: 0.2, marginBottom: 8 }} />
                   <p style={{ fontSize: 12 }}>Ağ bilgisi henüz toplanmadı.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {netDetails.map((net: any, idx: number) => (
                    <div key={idx} style={{ padding: 12, borderRadius: 8, background: "var(--gray-bg)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8, color: "var(--text)" }}>{net.name || `Interface #${idx+1}`}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <div className="rd2-muted-sm" style={{ fontSize: 10 }}>IP ADRESİ</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>{net.ip || "-"}</div>
                        </div>
                        <div>
                          <div className="rd2-muted-sm" style={{ fontSize: 10 }}>ALT AĞ (SUBNET)</div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{net.mask || "-"}</div>
                        </div>
                        <div>
                          <div className="rd2-muted-sm" style={{ fontSize: 10 }}>AĞ GEÇİDİ (GW)</div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{net.gw || "-"}</div>
                        </div>
                        <div>
                          <div className="rd2-muted-sm" style={{ fontSize: 10 }}>MAC ADRESİ</div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{net.mac || "-"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
