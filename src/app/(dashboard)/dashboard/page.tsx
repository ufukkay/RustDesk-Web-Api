"use client";

import { useAppStore } from "@/lib/store";
import { Monitor, Wifi, WifiOff, Users, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { devices, technicians, updateDeviceStatuses } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => updateDeviceStatuses(), 6000);
    return () => clearInterval(interval);
  }, [updateDeviceStatuses]);

  const online  = devices.filter(d => d.status === "online").length;
  const offline = devices.filter(d => d.status === "offline").length;

  const stats = [
    { label: "Toplam Cihaz",    value: devices.length,     icon: Monitor,  color: "bg-blue-50   text-blue-600",    ring: "ring-blue-100" },
    { label: "Çevrimiçi",       value: online,             icon: Wifi,     color: "bg-emerald-50 text-emerald-600", ring: "ring-emerald-100" },
    { label: "Çevrimdışı",      value: offline,            icon: WifiOff,  color: "bg-slate-100  text-slate-500",   ring: "ring-slate-200" },
    { label: "Aktif Teknisyen", value: technicians.length, icon: Users,    color: "bg-violet-50  text-violet-600",  ring: "ring-violet-100" },
  ];

  return (
    <div className="p-6 space-y-6 h-full">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Genel Bakış</h1>
        <p className="text-slate-500 text-sm mt-0.5">Altyapınızın anlık durumu</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, ring }) => (
          <div key={label} className={`bg-white rounded-xl ring-1 ${ring} p-5 flex items-center gap-4 shadow-sm`}>
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 ring-1 ${ring}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid xl:grid-cols-2 gap-5">
        {/* Device list */}
        <div className="bg-white rounded-xl ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Son Cihazlar</h2>
            <Link href="/devices" className="text-xs text-blue-600 hover:underline font-medium">Tümünü Gör →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {devices.map(d => (
              <div key={d.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${d.status === "online" ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.os} · {d.user}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  d.status === "online"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {d.status === "online" ? "Çevrimiçi" : "Çevrimdışı"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="bg-white rounded-xl ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">Son Aktiviteler</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { msg: "Ahmet Yılmaz cihaza bağlandı",     time: "2 dk önce",  dot: "bg-blue-500" },
              { msg: "SVR-DB-01 çevrimiçi oldu",         time: "8 dk önce",  dot: "bg-emerald-500" },
              { msg: "Yeni cihaz eklendi: MUHASEBE-PC",  time: "15 dk önce", dot: "bg-violet-500" },
              { msg: "Kullanıcı giriş yaptı",            time: "1 sa önce",  dot: "bg-amber-500" },
              { msg: "Bağlantı kesildi: DEPO-TERMINAL",  time: "2 sa önce",  dot: "bg-red-400" },
            ].map(({ msg, time, dot }, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/80 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <p className="text-sm text-slate-700 flex-1 font-medium">{msg}</p>
                <span className="text-xs text-slate-400 shrink-0">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer status */}
      <div className="flex items-center gap-2 text-sm text-slate-400 pb-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Sistem sağlıklı · Çalışma süresi: <strong className="text-slate-600 font-semibold">99.9%</strong></span>
      </div>
    </div>
  );
}
