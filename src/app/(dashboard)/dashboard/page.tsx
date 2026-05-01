"use client";

import { Activity, Laptop, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const stats = [
    {
      title: "Toplam Cihaz",
      value: "1,248",
      icon: Laptop,
      trend: "+12% bu ay",
      trendUp: true,
    },
    {
      title: "Çevrimiçi",
      value: "842",
      icon: Activity,
      trend: "Şu an aktif",
      trendUp: true,
      color: "text-emerald-500",
    },
    {
      title: "Aktif Teknisyen",
      value: "24",
      icon: Users,
      trend: "+2 bu hafta",
      trendUp: true,
    },
    {
      title: "Güvenli Bağlantılar",
      value: "99.9%",
      icon: ShieldCheck,
      trend: "Son 30 gün",
      trendUp: true,
      color: "text-blue-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Sisteme Genel Bakış</h1>
        <p className="text-muted-foreground">Tüm altyapınızın anlık durumu ve istatistikleri.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color || "text-gray-500"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <p className="text-xs text-gray-500">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for charts or recent activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4 bg-black/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Bağlantı Trafiği</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-white/5">
            <span className="text-gray-500 text-sm">Grafik Bileşeni Buraya Gelecek</span>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 bg-black/40 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Son Etkinlikler</CardTitle>
          </CardHeader>
          <CardContent className="border-t border-white/5 pt-4">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-gray-200">Teknisyen Ahmet cihaza bağlandı.</p>
                    <p className="text-xs text-gray-500">2 dakika önce</p>
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
