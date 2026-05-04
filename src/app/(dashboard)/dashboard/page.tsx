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
    { label: "Toplam Cihaz", value: devices.length, icon: Monitor, bg: "bg-brand-yellow", color: "text-brand-ink" },
    { label: "Online", value: onlineCount, icon: Zap, bg: "bg-green-bg", color: "text-green" },
    { label: "Offline", value: devices.length - onlineCount, icon: Monitor, bg: "bg-gray-bg", color: "text-muted" },
    { label: "Sistem", value: "Aktif", icon: ShieldCheck, bg: "bg-[#F0ECFF]", color: "text-[#5B30C8]" },
  ];

  return (
    <div className="rd2-page">
      {/* Stats Grid */}
      <div className="rd2-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="rd2-stat">
            <div className={`rd2-stat-icon ${s.bg} ${s.color}`}>
              <s.icon className="w-4.5 h-4.5" />
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
              Tümünü gör <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ul className="rd2-list">
            {devices.slice(0, 5).map(d => (
              <li key={d.id} className="rd2-list-row group">
                <Link href={`/devices/${d.id}`} className="rd2-device-cell flex-1">
                  <div className={`rd2-device-icon ${d.status === "online" ? "bg-brand-yellow/20 text-brand-ink" : "bg-gray-bg text-muted-foreground"}`}>
                    {d.os.includes("Windows") ? <Monitor className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="rd2-device-name">{d.name}</div>
                    <div className="rd2-device-meta font-mono">{d.id} · {d.os}</div>
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
            <span className="rd2-live">
              <span className="rd2-pulse bg-brand-yellow" /> Canlı
            </span>
          </div>
          <div className="rd2-timeline mt-2">
            {[
              { name: "Ufuk Kaya", action: "Sisteme giriş yaptı", time: "2 dk önce" },
              { name: "Ahmet Yılmaz", action: "Muhasebe-PC bağlantısı", time: "12 dk önce" },
              { name: "Selin Demir", action: "Yeni cihaz kaydı", time: "45 dk önce" },
            ].map((a, i) => (
              <div key={i} className="rd2-tl-row">
                <div className="rd2-tl-avatar bg-brand-yellow text-brand-ink">
                  {a.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="rd2-tl-text text-[13.5px]">
                    <span className="font-bold">{a.name}</span> <span className="opacity-70">{a.action}</span>
                  </div>
                  <div className="rd2-tl-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Server Health */}
      <section className="rd2-card">
        <div className="rd2-card-head !mb-4">
          <h3>Sunucu Durumu</h3>
        </div>
        <div className="rd2-health-grid">
          {[
            { label: "HBBS (ID Servisi)", val: health.hbbs === "Çalışıyor" ? "Aktif" : "Hata", color: health.hbbs === "Çalışıyor" ? "text-green" : "text-red", bg: health.hbbs === "Çalışıyor" ? "bg-green-bg" : "bg-red-bg" },
            { label: "HBBR (Relay)", val: health.hbbr === "Çalışıyor" ? "Aktif" : "Hata", color: health.hbbr === "Çalışıyor" ? "text-green" : "text-red", bg: health.hbbr === "Çalışıyor" ? "bg-green-bg" : "bg-red-bg" },
            { label: "API Sunucusu", val: "Çalışıyor", color: "text-green", bg: "bg-green-bg" },
            { label: "Uptime", val: "99.9%", color: "text-brand-ink", bg: "bg-brand-yellow" },
          ].map((s) => (
            <div key={s.label} className={`rd2-health-item ${s.bg}`}>
              <div className={`rd2-health-val ${s.color}`}>{s.val}</div>
              <div className="rd2-health-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
