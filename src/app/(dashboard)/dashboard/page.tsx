"use client";

import { useAppStore } from "@/lib/store";
import { Monitor, Wifi, WifiOff, Users, ShieldCheck, Play, Plus, Server, Laptop, Activity, ArrowRight, Mail } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { devices, technicians, updateDeviceStatuses } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => updateDeviceStatuses(), 10000);
    return () => clearInterval(interval);
  }, [updateDeviceStatuses]);

  const online  = devices.filter(d => d.status === "online").length;
  const offline = devices.length - online;

  const stats = [
    { label: "Toplam Cihaz",    value: devices.length,     icon: Monitor,  accent: "#FFCC00", ink: "#0E1116", hint: "Tüm envanter" },
    { label: "Çevrimiçi",       value: online,             icon: Server,   accent: "#E8F7EE", ink: "#1A8245", hint: "Anlık aktif" },
    { label: "Çevrimdışı",      value: offline,            icon: Laptop,   accent: "#F1F2F4", ink: "#5C6573", hint: "Bağlantı yok" },
    { label: "Aktif Teknisyen", value: technicians.length, icon: Users,    accent: "#F4ECFF", ink: "#5B30C8", hint: "Tümü aktif" },
  ];

  return (
    <div className="p-8 space-y-10 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Genel Bakış</h1>
        <p className="text-sm text-muted-foreground">Sisteminizin durumunu ve aktif bağlantılarınızı takip edin.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, ink }) => (
          <div key={label} className="bg-card rounded-brand-lg border border-border p-6 shadow-brand-sm hover:shadow-brand transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary">
                <Icon className="w-5 h-5 text-foreground" style={{ color: ink }} />
              </div>
            </div>
            <p className="text-3xl font-semibold text-foreground tracking-tight">{value}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Devices */}
        <div className="bg-card rounded-brand-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h2 className="font-semibold text-foreground text-sm">Son Cihazlar</h2>
            <Link href="/devices" className="text-xs text-primary font-semibold hover:underline">
              Tümünü Gör
            </Link>
          </div>
          <div className="divide-y divide-border">
            {devices.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm italic">
                Henüz cihaz bulunmuyor. Bağlantıları bekleyin...
              </div>
            ) : (
              devices.slice(0, 6).map(d => (
                <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-muted-foreground">
                      {d.os.includes("Windows") ? <Monitor className="w-4.5 h-4.5" /> : d.os.includes("mac") ? <Laptop className="w-4.5 h-4.5" /> : <Server className="w-4.5 h-4.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.os} · {d.user}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                    d.status === "online" ? "text-emerald-600 bg-emerald-500/10" : "text-muted-foreground bg-secondary"
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${d.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                    {d.status === "online" ? "Online" : "Offline"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities - Simplified to static placeholders for now */}
        <div className="bg-card rounded-brand-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h2 className="font-semibold text-foreground text-sm">Aktivite</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Canlı
            </div>
          </div>
          <div className="divide-y divide-border">
            {[
              { name: "Ufuk Kaya",   action: "Sisteme giriş yaptı",             time: "2 dk önce" },
              { name: "Ahmet Yılmaz", action: "Muhasebe-PC bağlantısı",  time: "12 dk önce" },
              { name: "Selin Demir",  action: "Yeni cihaz kaydı",  time: "45 dk önce" },
            ].map((a, i) => (
              <div key={i} className="px-6 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-semibold text-muted-foreground shrink-0">
                  {a.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground leading-tight">
                    <span className="font-semibold">{a.name}</span> <span className="text-muted-foreground">{a.action}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-2 bg-muted/30 w-fit px-4 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        Sistem sağlıklı · Uptime: <span className="text-foreground font-semibold ml-0.5">99.9%</span>
      </div>
    </div>
  );
}
