"use client";

import { useAppStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import {
  Cpu, HardDrive, Activity,
  Play, Lock,
  RotateCcw, Power, Terminal, Send, RefreshCw,
  FolderUp, Loader2, ChevronLeft,
  Network, Wifi, WifiOff,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

type TabType = "overview" | "networks" | "terminal";

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { devices, fetchDevices } = useAppStore();

  const [mounted,      setMounted]      = useState(false);
  const [activeTab,    setActiveTab]    = useState<TabType>("overview");
  const [wsConnected,  setWsConnected]  = useState(false);
  const [liveStatus,   setLiveStatus]   = useState<"online" | "offline" | null>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<Record<string, any>>({});

  const [terminalInput,   setTerminalInput]   = useState("");
  const [terminalHistory, setTerminalHistory] = useState<{ cmd: string; output: string; status: string }[]>([]);
  const [actionStatus,    setActionStatus]    = useState<Record<string, "idle" | "running" | "success" | "error">>({});

  const [connSettings, setConnSettings] = useState({ host: "", defaultPassword: "" });
  const socketRef  = useRef<Socket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // ── Mount + settings ───────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    fetchDevices();
    fetch("/api/rustdesk/settings")
      .then(r => r.json())
      .then(d => setConnSettings({ host: d.idServer || d.host || "", defaultPassword: d.defaultPassword || "" }))
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

    // Check current agent status right after connect
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

    // Terminal result — base64 decode
    socket.on("result", (data: any) => {
      if (data.action === "terminal") {
        setTerminalHistory(prev => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].cmd === data.command && next[i].status === "idle") {
              const raw = data.isBase64 ? atob(data.output) : (data.output ?? "");
              next[i] = { ...next[i], output: raw || "(boş çıktı)", status: "success" };
              break;
            }
          }
          return next;
        });
      }
    });

    socket.on("command_queued", () => {
      setTerminalHistory(prev => {
        const next = [...prev];
        const last = next.findLastIndex(e => e.status === "idle");
        if (last >= 0) next[last] = { ...next[last], output: "⏳ Komut kuyruğa alındı — agent bağlandığında çalışacak.", status: "queued" };
        return next;
      });
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [device?.id]);

  // Auto-scroll terminal
  useEffect(() => {
    if (activeTab === "terminal" && terminalRef.current)
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalHistory, activeTab]);

  // ── Actions ────────────────────────────────────────────────────────
  const runAction = (action: string, command?: string) => {
    if (!device || !socketRef.current) return;
    setActionStatus(prev => ({ ...prev, [action]: "running" }));

    socketRef.current.emit("send_command", { deviceId: device.id, action, command: command || "" });

    if (action === "terminal" && command) {
      setTerminalHistory(prev => [...prev, { cmd: command, output: "Yanıt bekleniyor...", status: "idle" }]);
    }

    setTimeout(() => setActionStatus(prev => ({ ...prev, [action]: "idle" })), 3000);
  };

  const handleConnect = () => {
    if (!device) return;
    const id  = String(device.id).replace(/\s+/g, "");
    const url = `rustdesk://${id}?password=${connSettings.defaultPassword}&host=${connSettings.host}`;
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
            {/* WebSocket bağlantı göstergesi */}
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
      <div className="rd2-card rd2-action-bar" style={{ marginBottom: 24 }}>
        <button onClick={handleConnect} disabled={!online} className="rd2-btn"
          style={online ? { background: "#FFCC00", color: "#0E1116", border: "1px solid rgba(14,17,22,.08)" } : { opacity: .5 }}>
          <Play width={14} height={14} /> Uzaktan Bağlan
        </button>

        <button onClick={() => window.open(`rustdesk://file-transfer/${device.id}`, "_self")}
          disabled={!online} className="rd2-btn"
          style={online ? { background: "#0E1116", color: "#fff", border: "none" } : { opacity: .5 }}>
          <FolderUp width={14} height={14} /> Dosya Transferi
        </button>

        <button
          onClick={() => window.open(`rustdesk://terminal/${device.id}?password=${connSettings.defaultPassword}&host=${connSettings.host}`, "_self")}
          disabled={!online} className="rd2-btn"
          style={online ? { background: "#0E1116", color: "#fff", border: "none" } : { opacity: .5 }}>
          <Terminal width={14} height={14} /> Native Terminal
        </button>

        <div style={{ width: 1, height: 24, background: "var(--line)", margin: "0 4px" }} />

        <button onClick={() => runAction("restart")} disabled={!online} className="rd2-btn rd2-btn-sm"
          style={online ? { background: "var(--gray-bg)" } : { opacity: .5 }}>
          {actionStatus.restart === "running"
            ? <><Loader2 width={13} height={13} className="animate-spin" /> Bekleyin...</>
            : <><RotateCcw width={13} height={13} /> Yeniden Başlat</>}
        </button>

        <button onClick={() => runAction("shutdown")} disabled={!online} className="rd2-btn rd2-btn-sm"
          style={online ? { background: "var(--red-bg)", color: "var(--red)" } : { opacity: .5 }}>
          <Power width={13} height={13} /> Kapat
        </button>

        <button onClick={() => runAction("lock")} disabled={!online} className="rd2-btn rd2-btn-sm"
          style={online ? { background: "var(--gray-bg)" } : { opacity: .5 }}>
          <Lock width={13} height={13} /> Kilitle
        </button>

        <button
          onClick={() => { fetchDevices(); }}
          className="rd2-icon-btn rd2-icon-btn-sm"
          style={{ marginLeft: "auto" }}
        >
          <RefreshCw width={14} height={14} />
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="rd2-tabs" style={{ marginBottom: 24, borderColor: "var(--line)" }}>
        {(["overview", "networks", "terminal"] as TabType[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rd2-tab ${activeTab === tab ? "on" : ""}`}
            style={activeTab === tab ? { borderBottomColor: "#FFCC00", color: "var(--text)" } : {}}>
            {{ overview: "Özet", networks: "Ağlar", terminal: "Terminal" }[tab]}
          </button>
        ))}
      </div>

      {/* ── Tab: OVERVIEW ──────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="rd2-detail-grid">

          {/* Sol: Cihaz özeti */}
          <div className="rd2-card rd2-card-flush" style={{ alignSelf: "start" }}>
            <div style={{ background: "var(--gray-bg)", padding: "12px 16px", borderBottom: "1px solid var(--line2)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>Cihaz Özeti</h3>
            </div>
            <div style={{ padding: "8px 16px 16px" }}>
              {[
                ["İsim",             get("hostname") !== "-" ? get("hostname") : device.name],
                ["Giriş Yapmış K.",  device.user],
                ["AD/LDAP Domain",   get("adDomain")],
                ["Form Faktörü",     get("formFactor")],
                ["Üretici",          get("manufacturer")],
                ["Model",            get("model")],
                ["İşlemci",          get("processor")],
                ["Seri Numarası",    get("serialNumber")],
                ["Ajan Sürümü",      get("agentVersion")],
                ["Son Görülme",      device.lastSeen],
                ["IP Adresi",        get("ip")],
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

          {/* Sağ kolonlar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* OS özeti */}
            <div className="rd2-card rd2-card-flush">
              <div style={{ background: "var(--gray-bg)", padding: "12px 16px", borderBottom: "1px solid var(--line2)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>İşletim Sistemi</h3>
              </div>
              <div style={{ padding: "8px 16px 16px" }}>
                {[
                  ["OS Adı",    get("osName")],
                  ["Derleme",   get("osBuild")],
                  ["Boot Time", get("bootTime")],
                ].map(([label, value]) => (
                  <div key={label as string} className="rd2-info-row">
                    <span className="rd2-info-label">{label}</span>
                    <span className="rd2-info-val">{String(value || "-")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performans */}
            <div className="rd2-card rd2-card-flush">
              <div style={{ background: "var(--gray-bg)", padding: "12px 16px", borderBottom: "1px solid var(--line2)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>Performans</h3>
              </div>
              <div className="rd2-stats-grid rd2-stats-3" style={{ padding: 16, gap: 16 }}>
                {[
                  { label: "İŞLEMCİ", value: get("processor"), icon: <Cpu width={16} height={16} /> },
                  { label: "BELLEK",  value: get("ram"),        icon: <Activity width={16} height={16} /> },
                  { label: "DİSK",    value: get("disk"),       icon: <HardDrive width={16} height={16} /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="rd2-stat rd2-stat-mini" style={{ boxShadow: "none", border: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--muted)" }}>
                      {icon}
                      <span className="rd2-stat-label" style={{ margin: 0 }}>{label}</span>
                    </div>
                    <div className="rd2-stat-val" style={{ fontSize: 13, wordBreak: "break-word" }}>{String(value || "-")}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Tab: NETWORKS ──────────────────────────────────────────── */}
      {activeTab === "networks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {netDetails.length === 0 ? (
            <div className="rd2-card" style={{ padding: "40px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", borderStyle: "dashed" }}>
              <Network style={{ width: 48, height: 48, color: "var(--muted2)", marginBottom: 16 }} />
              <h3 style={{ fontSize: 15, fontWeight: 800 }}>Ağ bilgisi bulunamadı</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Agent bağlandığında otomatik dolacak.</p>
            </div>
          ) : (
            <div className="rd2-2col">
              {netDetails.map((net: any, idx: number) => (
                <div key={idx} className="rd2-card rd2-card-flush">
                  <div style={{ background: "var(--gray-bg)", padding: "12px 16px", borderBottom: "1px solid var(--line2)" }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
                      {net.name || `Ağ Kartı #${idx + 1}`}
                    </h3>
                  </div>
                  <div style={{ padding: "8px 16px 16px" }}>
                    {[
                      ["IP Adresi",   net.ip,    "var(--green)"],
                      ["Alt Ağ",      net.mask],
                      ["Ağ Geçidi",   net.gw],
                      ["MAC",         net.mac],
                      ["Hız",         net.speed ? `${net.speed} Mbit/s` : "-"],
                    ].map(([label, value, color]) => (
                      <div key={label as string} className="rd2-info-row">
                        <span className="rd2-info-label">{label}</span>
                        <span className="rd2-info-val rd2-mono" style={color ? { color: color as string } : {}}>{String(value || "-")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: TERMINAL ──────────────────────────────────────────── */}
      {activeTab === "terminal" && (
        <div className="rd2-terminal" style={{ height: 600, display: "flex", flexDirection: "column" }}>
          <div className="rd2-term-header" style={{ flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Terminal style={{ width: 16, height: 16, color: "#FFCC00" }} />
              <span style={{ color: "#FFF", fontSize: 12, fontWeight: 800 }}>Command Terminal</span>
              <span className="rd2-term-badge">CMD / PowerShell</span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: wsConnected ? "rgba(26,130,69,.25)" : "rgba(255,255,255,.08)",
              color:      wsConnected ? "#4ade80" : "#8B92A0",
            }}>
              {wsConnected ? "● WS Canlı" : "○ Polling"}
            </span>
          </div>

          <div className="rd2-term-body" style={{ flex: 1 }} ref={terminalRef}>
            <div className="rd2-term-comment"># {device.name} — {device.id}</div>
            {terminalHistory.map((e, i) => (
              <div key={i} style={{ marginTop: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ opacity: .3 }}>PS {">"}</span>
                  <span style={{ color: "#FFCC00" }}>{e.cmd}</span>
                </div>
                <pre style={{
                  marginTop: 4, fontSize: 11, whiteSpace: "pre-wrap",
                  color: e.status === "queued" ? "#FFCC00" : e.status === "success" ? "#34d399" : "rgba(255,255,255,.5)",
                }}>
                  {e.output}
                </pre>
              </div>
            ))}
            <span style={{ color: "#34d399", animation: "rd2-pulse 1s infinite" }}>_</span>
          </div>

          <form className="rd2-term-input" style={{ flexShrink: 0 }}
            onSubmit={e => {
              e.preventDefault();
              if (!terminalInput.trim() || !online) return;
              runAction("terminal", terminalInput.trim());
              setTerminalInput("");
            }}>
            <input
              value={terminalInput}
              onChange={e => setTerminalInput(e.target.value)}
              placeholder={online ? "Komut girin (cmd veya PowerShell)..." : "Cihaz çevrimdışı"}
              disabled={!online}
            />
            <button type="submit" disabled={!online || !terminalInput.trim()}
              style={{
                background: "#FFCC00", color: "#0E1116",
                padding: "0 24px", fontWeight: 900, textTransform: "uppercase",
                fontSize: 13, border: "none", cursor: "pointer",
                opacity: (!online || !terminalInput.trim()) ? .5 : 1,
              }}>
              <Send width={16} height={16} style={{ marginRight: 8, display: "inline-block", verticalAlign: "middle" }} />
              Gönder
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
