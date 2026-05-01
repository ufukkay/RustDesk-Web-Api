"use client";

import { Activity, Laptop, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function DashboardPage() {
  const { devices, updateDeviceStatus } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      if(randomDevice) {
        updateDeviceStatus(randomDevice.id, randomDevice.status === "online" ? "offline" : "online");
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [devices, updateDeviceStatus]);

  const onlineCount = devices.filter(d => d.status === "online").length;

  const stats = [
    {
      title: "Toplam Cihaz",
      value: devices.length.toString(),
      icon: Laptop,
      trend: "+12% bu ay",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Çevrimiçi",
      value: onlineCount.toString(),
      icon: Activity,
      trend: "Şu an aktif",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Aktif Teknisyen",
      value: "2",
      icon: Users,
      trend: "Sistemde geziyor",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Güvenli Bağlantılar",
      value: "99.9%",
      icon: ShieldCheck,
      trend: "Son 30 gün",
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sisteme Genel Bakış</h1>
        <p className="text-slate-500 font-medium">Tüm altyapınızın anlık durumu ve istatistikleri.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-500">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
              <p className="text-xs font-semibold text-slate-400">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold">Bağlantı Trafiği</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-slate-100">
            <span className="text-slate-400 text-sm font-medium">Grafik Bileşeni Buraya Gelecek</span>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold">Son Etkinlikler</CardTitle>
          </CardHeader>
          <CardContent className="border-t border-slate-100 pt-4">
            <div className="space-y-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-semibold text-slate-700">Teknisyen Ahmet cihaza bağlandı.</p>
                    <p className="text-xs font-medium text-slate-400">{i * 2} dakika önce</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
