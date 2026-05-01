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
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, accent, ink, hint }) => (
          <div key={label} className="bg-white rounded-brand-lg border border-brand-ink/5 p-6 shadow-brand-sm hover:shadow-brand transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center ring-1 ring-brand-ink/5 shadow-brand-sm transition-transform group-hover:scale-105" style={{ background: accent, color: ink }}>
                <Icon className="w-5.5 h-5.5" />
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Canlı</span>
            </div>
            <p className="text-3xl font-black text-brand-ink leading-none tracking-tighter">{value}</p>
            <p className="text-[13px] font-bold text-slate-500 mt-2">{label}</p>
            <p className="text-[11px] text-slate-400 mt-4 font-medium">{hint}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid xl:grid-cols-2 gap-8">
        {/* Recent Devices */}
        <div className="bg-white rounded-brand-lg border border-brand-ink/5 shadow-brand-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-brand-ink/5 flex items-center justify-between bg-brand-bg/10">
            <div>
              <h2 className="font-black text-brand-ink text-sm">Son Cihazlar</h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Aktif Bağlantılar</p>
            </div>
            <Link href="/devices" className="text-[12px] text-brand-ink hover:bg-brand-ink/5 px-3 py-1.5 rounded-lg font-black transition-colors flex items-center gap-1.5">
              Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-brand-ink/5">
            {devices.slice(0, 6).map(d => (
              <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-brand-bg/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-brand-sm ring-1 ring-brand-ink/5 ${d.status === "online" ? "bg-brand-yellow/10 text-brand-ink" : "bg-slate-50 text-slate-400"}`}>
                    {d.os.includes("Windows") ? <Monitor className="w-4.5 h-4.5" /> : d.os.includes("mac") ? <Laptop className="w-4.5 h-4.5" /> : <Server className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-black text-brand-ink group-hover:text-brand-ink transition-colors">{d.name}</p>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">{d.os} · <span className="text-slate-500 font-black">{d.user}</span></p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight ${
                  d.status === "online" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-slate-100 text-slate-400"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${d.status === "online" ? "bg-emerald-500 animate-brand-pulse" : "bg-slate-300"}`} />
                  {d.status === "online" ? "ÇEVRİMİÇİ" : "ÇEVRİMDIŞI"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-brand-lg border border-brand-ink/5 shadow-brand-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-brand-ink/5 flex items-center justify-between bg-brand-bg/10">
            <div>
              <h2 className="font-black text-brand-ink text-sm">Son Aktiviteler</h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">İşlem Günlüğü</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-white border border-brand-ink/5 px-2.5 py-1 rounded-full shadow-brand-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-brand-pulse" />
              Canlı
            </div>
          </div>
          <div className="divide-y divide-brand-ink/5">
            {[
              { who: "UK", name: "Ufuk Kaya",   action: "Sisteme giriş yaptı",             time: "2 dk önce",  kind: "login",   color: "bg-brand-yellow" },
              { who: "AY", name: "Ahmet Yılmaz", action: "MUHASEBE-PC cihazına bağlandı",  time: "12 dk önce", kind: "connect", color: "bg-emerald-400" },
              { who: "SD", name: "Selin Demir",  action: "Yeni cihaz ekledi: SEVKIYAT-LP",  time: "45 dk önce", kind: "add",     color: "bg-violet-400" },
              { who: "S",  name: "Sistem",       action: "SVR-DB-01 çevrimiçi oldu",        time: "1 sa önce",  kind: "status",  color: "bg-blue-400" },
              { who: "AY", name: "Ahmet Yılmaz", action: "DEPO-TERMINAL bağlantısını kesti", time: "2 sa önce",  kind: "status",  color: "bg-slate-400" },
              { who: "UK", name: "Ufuk Kaya",   action: "SMTP ayarlarını güncelledi",        time: "4 sa önce",  kind: "settings",color: "bg-amber-400" },
            ].map((a, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-brand-bg/30 transition-colors group">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-brand-ink font-black text-xs ring-1 ring-brand-ink/5 shadow-brand-sm ${a.color}`}>
                  {a.who}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-brand-ink leading-tight">
                    <span className="font-black">{a.name}</span> <span className="text-slate-600 font-medium">{a.action}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="font-black text-brand-ink text-sm uppercase tracking-widest">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Cihaz Ekle",    sub: "Yeni RustDesk ID kaydet", icon: Plus,   color: "bg-brand-yellow", ink: "text-brand-ink" },
            { label: "Hızlı Bağlan",  sub: "ID ile doğrudan bağlantı", icon: Play,   color: "bg-emerald-400",  ink: "text-brand-ink" },
            { label: "Teknisyen Ekle",sub: "Yeni yetkili davet et",    icon: Users,  color: "bg-violet-400",   ink: "text-brand-ink" },
            { label: "SMTP Testi",    sub: "E-posta ayarlarını dene",  icon: Mail,   color: "bg-blue-400",     ink: "text-brand-ink" },
          ].map((q) => (
            <button key={q.label} className="bg-white p-5 rounded-brand-lg border border-brand-ink/5 shadow-brand-sm hover:shadow-brand hover:-translate-y-1 transition-all text-left flex items-center gap-4 group">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-brand-sm ring-1 ring-brand-ink/5 transition-transform group-hover:scale-105 ${q.color} ${q.ink}`}>
                <q.icon className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="text-[14px] font-black text-brand-ink tracking-tight">{q.label}</p>
                <p className="text-[11.5px] text-slate-400 font-bold mt-1 leading-tight">{q.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-2 bg-white w-fit px-4 py-2 rounded-full border border-brand-ink/5 shadow-brand-sm text-[12px] font-bold text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        Sistem sağlıklı · Uptime: <span className="text-brand-ink font-black ml-1">99.9%</span>
      </div>
    </div>
  );
}
