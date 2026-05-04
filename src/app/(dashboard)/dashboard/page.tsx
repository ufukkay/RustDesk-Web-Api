"use client";

import { useAppStore } from "@/lib/store";
import { Monitor, Zap, Users, Activity, ChevronRight, User as UserIcon, ShieldCheck, Laptop, Server, Database } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { devices, fetchDevices } = useAppStore();
  const [health, setHealth] = useState({ hbbs: "...", hbbr: "..." });

  useEffect(() => {
    fetchDevices();

    const interval = setInterval(() => {
      fetchDevices();
      fetch("/api/system/health")
        .then(res => res.json())
        .then(data => setHealth(data))
        .catch(() => setHealth({ hbbs: "Hata", hbbr: "Hata" }));
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const onlineCount = devices.filter(d => d.status === "online").length;
  
  const stats = [
    { label: "Toplam Cihaz", value: devices.length, icon: Monitor, bg: "#FFCC00", color: "#0E1116" },
    { label: "Online", value: onlineCount, icon: Zap, bg: "var(--green-bg)", color: "var(--green)" },
    { label: "Offline", value: devices.length - onlineCount, icon: Monitor, bg: "var(--gray-bg)", color: "var(--muted)" },
    { label: "Sistem", value: "Aktif", icon: ShieldCheck, bg: "#F0ECFF", color: "#5B30C8" },
  ];

  return (
    <div className="rd2-page">
      {/* Stats Grid */}
      <div className="rd2-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="rd2-stat">
            <div className="rd2-stat-icon" style={{ background: s.bg, color: s.color }}>
              <s.icon width="18" height="18" />
            </div>
            <div className="rd2-stat-val">{s.value}</div>
            <div className="rd2-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rd2-2col">
        {/* Recent Devices */}
        <section className="rd2-card">
          <div className="rd2-card-head">
            <div>
              <h3>Son Cihazlar</h3>
              <p className="rd2-muted-sm">Anlık durum</p>
            </div>
            <Link href="/devices" className="rd2-link-btn">
              Tümünü gör <ChevronRight width="13" height="13" />
            </Link>
          </div>
          <ul className="rd2-list">
            {devices.slice(0, 5).map(d => (
              <li key={d.id} className="rd2-list-row" style={{ cursor: "pointer" }}>
                <Link href={`/devices/${d.id}`} className="rd2-device-cell">
                  <div className="rd2-device-icon" style={{ background: d.status === "online" ? "#FFCC0033" : "#F1F2F4", color: "#0E1116" }}>
                    {d.os.includes("Windows") ? <Monitor width="16" height="16" /> : <Laptop width="16" height="16" />}
                  </div>
                  <div>
                    <div className="rd2-device-name">{d.name}</div>
                    <div className="rd2-device-meta rd2-mono">{d.id} · {d.os}</div>
                  </div>
                </Link>
                <span className={`rd2-pill ${d.status === "online" ? "rd2-pill-on" : "rd2-pill-off"}`}>
                  <span className={`rd2-dot ${d.status === "online" ? "rd2-dot-green animate-brand-pulse" : "rd2-dot-gray"}`} />
                  {d.status === "online" ? "Online" : "Offline"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Activity Timeline */}
        <section className="rd2-card">
          <div className="rd2-card-head">
            <div>
              <h3>Son Aktiviteler</h3>
              <p className="rd2-muted-sm">Bugün</p>
            </div>
            <span className="rd2-live"><span className="rd2-pulse" style={{ background: "#FFCC00" }} /> Canlı</span>
          </div>
          <div className="rd2-timeline">
            {[
              { name: "Ufuk Kaya", action: "Sisteme giriş yaptı", time: "2 dk önce" },
              { name: "Ahmet Yılmaz", action: "Muhasebe-PC bağlantısı", time: "12 dk önce" },
              { name: "Selin Demir", action: "Yeni cihaz kaydı", time: "45 dk önce" },
            ].map((a, i) => (
              <div key={i} className="rd2-tl-row">
                {i < 2 && <div className="rd2-tl-line" />}
                <div className="rd2-tl-avatar" style={{ background: "#FFCC00", color: "#0E1116" }}>
                  {a.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="rd2-tl-text"><b>{a.name}</b> {a.action}</div>
                  <div className="rd2-tl-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Server Health */}
      <section className="rd2-card rd2-health">
        <div className="rd2-card-head" style={{ marginBottom: 12 }}>
          <h3>Sunucu Durumu</h3>
        </div>
        <div className="rd2-health-grid">
          {[
            { label: "HBBS (ID Servisi)", val: health.hbbs === "Çalışıyor" ? "Aktif" : "Hata", color: health.hbbs === "Çalışıyor" ? "#1A8245" : "#C0392B", bg: health.hbbs === "Çalışıyor" ? "#E8F7EE" : "#FCEAEA" },
            { label: "HBBR (Relay)", val: health.hbbr === "Çalışıyor" ? "Aktif" : "Hata", color: health.hbbr === "Çalışıyor" ? "#1A8245" : "#C0392B", bg: health.hbbr === "Çalışıyor" ? "#E8F7EE" : "#FCEAEA" },
            { label: "API Sunucusu", val: "Çalışıyor", color: "#1A8245", bg: "#E8F7EE" },
            { label: "Uptime", val: "99.9%", color: "#0E1116", bg: "#FFCC00" },
          ].map((s) => (
            <div key={s.label} className="rd2-health-item" style={{ background: s.bg }}>
              <div className="rd2-health-val" style={{ color: s.color }}>{s.val}</div>
              <div className="rd2-health-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
