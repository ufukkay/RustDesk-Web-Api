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
    <div className="flex flex-col gap-6 rd2-page">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 rd2-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-black/5 rounded-xl p-5 shadow-sm rd2-stat">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 rd2-stat-icon ${s.bg} ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black tracking-tight rd2-stat-val">{s.value}</div>
            <div className="text-[12px] font-bold text-[#5C6573] mt-1 rd2-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 rd2-2col">
        {/* Recent Devices */}
        <section className="bg-white border border-black/5 rounded-xl p-6 shadow-sm rd2-card">
          <div className="flex items-center justify-between mb-6 rd2-card-head">
            <div>
              <h3 className="text-[15px] font-black tracking-tight">Son Cihazlar</h3>
              <p className="text-[12px] text-[#8B92A0] font-bold mt-0.5 rd2-muted-sm">Anlık durum</p>
            </div>
            <Link href="/devices" className="flex items-center gap-1.5 text-[12px] font-black text-[#0E1116] opacity-60 hover:opacity-100 transition-opacity rd2-link-btn">
              Tümünü gör <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ul className="flex flex-col gap-3 rd2-list">
            {devices.slice(0, 5).map(d => (
              <li key={d.id} className="flex items-center justify-between p-3 border border-black/[0.03] rounded-lg group rd2-list-row">
                <Link href={`/devices/${d.id}`} className="flex items-center gap-3 flex-1 rd2-device-cell">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors rd2-device-icon ${d.status === "online" ? "bg-[#FFCC00]/20 text-[#0E1116]" : "bg-[#F1F2F4] text-[#8B92A0]"}`}>
                    {d.os.includes("Windows") ? <Monitor className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-black tracking-tight rd2-device-name">{d.name}</div>
                    <div className="text-[11px] font-mono text-[#8B92A0] font-bold rd2-device-meta">{d.id} · {d.os}</div>
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
        <section className="bg-white border border-black/5 rounded-xl p-6 shadow-sm rd2-card">
          <div className="flex items-center justify-between mb-6 rd2-card-head">
            <div>
              <h3 className="text-[15px] font-black tracking-tight">Son Aktiviteler</h3>
              <p className="text-[12px] text-[#8B92A0] font-bold mt-0.5 rd2-muted-sm">Bugün</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 uppercase tracking-wider rd2-live">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse rd2-pulse" /> Canlı
            </span>
          </div>
          <div className="flex flex-col gap-4 mt-2 rd2-timeline">
            {[
              { name: "Ufuk Kaya", action: "Sisteme giriş yaptı", time: "2 dk önce" },
              { name: "Ahmet Yılmaz", action: "Muhasebe-PC bağlantısı", time: "12 dk önce" },
              { name: "Selin Demir", action: "Yeni cihaz kaydı", time: "45 dk önce" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-black/[0.03] last:border-0 rd2-tl-row">
                <div className="w-9 h-9 rounded-full bg-[#FFCC00] text-[#0E1116] flex items-center justify-center font-black text-[11px] shrink-0 rd2-tl-avatar">
                  {a.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="text-[13.5px] rd2-tl-text">
                    <span className="font-black text-[#0E1116]">{a.name}</span> <span className="text-[#5C6573] ml-1">{a.action}</span>
                  </div>
                  <div className="text-[11px] text-[#8B92A0] font-bold mt-0.5 rd2-tl-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Server Health */}
      <section className="bg-white border border-black/5 rounded-xl p-6 shadow-sm rd2-card">
        <div className="flex items-center justify-between mb-6 rd2-card-head">
          <h3 className="text-[15px] font-black tracking-tight">Sunucu Durumu</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 rd2-health-grid">
          {[
            { label: "HBBS (ID Servisi)", val: health.hbbs === "Çalışıyor" ? "Aktif" : "Hata", color: health.hbbs === "Çalışıyor" ? "text-green" : "text-red", bg: health.hbbs === "Çalışıyor" ? "bg-green-bg" : "bg-red-bg" },
            { label: "HBBR (Relay)", val: health.hbbr === "Çalışıyor" ? "Aktif" : "Hata", color: health.hbbr === "Çalışıyor" ? "text-green" : "text-red", bg: health.hbbr === "Çalışıyor" ? "bg-green-bg" : "bg-red-bg" },
            { label: "API Sunucusu", val: "Çalışıyor", color: "text-green", bg: "bg-green-bg" },
            { label: "Uptime", val: "99.9%", color: "text-brand-ink", bg: "bg-brand-yellow" },
          ].map((s) => (
            <div key={s.label} className={`p-3.5 rounded-xl rd2-health-item ${s.bg}`}>
              <div className={`text-[15px] font-black rd2-health-val ${s.color}`}>{s.val}</div>
              <div className="text-[11px] text-[#5C6573] font-bold mt-0.5 rd2-health-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
