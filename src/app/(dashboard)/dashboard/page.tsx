"use client";

import { useAppStore } from "@/lib/store";
import { Monitor, Users, Shield, Server, Laptop, Activity, Database, ChevronRight, User as UserIcon, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * DashboardPage - Sistemin genel durumunu özetleyen ana sayfa.
 */
export default function DashboardPage() {
  const { devices, technicians, fetchDevices } = useAppStore();
  const [serverKey, setServerKey] = useState("Yükleniyor...");
  const [health, setHealth] = useState({ hbbs: "...", hbbr: "..." });

  useEffect(() => {
    // Sayfa açıldığında cihazları çek
    fetchDevices();

    // Her 10 saniyede bir verileri tazele
    const interval = setInterval(() => {
      fetchDevices();
      
      // Sistem (HBBS/HBBR) çalışma durumunu kontrol et
      fetch("/api/system/health")
        .then(res => res.json())
        .then(data => setHealth(data))
        .catch(() => setHealth({ hbbs: "Hata", hbbr: "Hata" }));
    }, 10000);
    
    // RustDesk bağlantı anahtarını sunucudan çek
    fetch("/api/rustdesk/server-key")
      .then(res => res.json())
      .then(data => setServerKey(data.key))
      .catch(() => setServerKey("Okunamadı"));

    return () => clearInterval(interval);
  }, [fetchDevices]);

  // Online cihaz sayısını hesapla
  const onlineCount = devices.filter(d => d.status === "online").length;
  
  // İstatistik kartları verisi
  const stats = [
    { label: "Toplam Cihaz", value: devices.length, icon: Monitor, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Online Cihaz", value: onlineCount, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "HBBS (ID Servis)", value: health.hbbs, icon: Server, color: health.hbbs === "Çalışıyor" ? "text-emerald-500" : "text-red-500", bg: health.hbbs === "Çalışıyor" ? "bg-emerald-500/10" : "bg-red-500/10" },
    { label: "HBBR (Relay)", value: health.hbbr, icon: Database, color: health.hbbr === "Çalışıyor" ? "text-emerald-500" : "text-red-500", bg: health.hbbr === "Çalışıyor" ? "bg-emerald-500/10" : "bg-red-500/10" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Başlık Bölümü */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Genel Bakış</h1>
        <p className="text-sm text-muted-foreground">Sisteminizin durumunu ve aktif bağlantılarınızı takip edin.</p>
      </div>

      {/* İstatistik Izgarası */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-brand-lg border border-border p-6 shadow-brand-sm hover:shadow-brand transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-3xl font-black text-foreground tracking-tight">{s.value}</p>
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Sunucu Anahtarı Kartı (Önemli Bilgi) */}
          <div className="bg-brand-ink text-white p-6 rounded-brand-lg shadow-brand relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-brand-yellow flex items-center gap-2">
                  <Shield className="w-5 h-5" /> RustDesk Sunucu Anahtarı (Key)
                </h3>
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest max-w-[300px]">
                  Bağlantı hatalarını gidermek için bu anahtarı uygulamadaki "Key" alanına yapıştırın.
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/10 font-mono text-[13px] select-all break-all backdrop-blur-md hover:bg-white/15 transition-all">
                {serverKey}
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-yellow/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
          </div>

          {/* Son Eklenen Cihazlar Listesi */}
          <div className="bg-card rounded-brand-lg border border-border shadow-brand-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h2 className="text-[11px] font-black text-brand-ink uppercase tracking-widest">Son Eklenen Cihazlar</h2>
              <Link href="/devices">
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all group">
                  Tümünü Gör <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {devices.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm italic">Henüz cihaz bulunmuyor.</div>
              ) : (
                devices.slice(0, 5).map(d => (
                  <div key={d.id} className="p-4 px-6 hover:bg-muted/10 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-all">
                        {d.os.includes("Windows") ? <Monitor className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground tracking-tight">{d.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{d.id} · {d.os}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
                        d.status === "online" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${d.status === "online" ? "bg-emerald-500 animate-brand-pulse" : "bg-muted-foreground/50"}`} />
                        {d.status === "online" ? "ONLINE" : "OFFLINE"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Son Aktiviteler (Simüle edilmiş veri) */}
        <div className="bg-card rounded-brand-lg border border-border shadow-brand-sm overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-border bg-muted/20">
            <h2 className="text-[11px] font-black text-brand-ink uppercase tracking-widest">Son Aktiviteler</h2>
          </div>
          <div className="p-6 space-y-6">
            {[
              { name: "Ufuk Kaya", action: "Sisteme giriş yaptı", time: "2 dk önce" },
              { name: "Ahmet Yılmaz", action: "Muhasebe-PC bağlantısı", time: "12 dk önce" },
              { name: "Selin Demir", action: "Yeni cihaz kaydı", time: "45 dk önce" },
            ].map((a, i) => (
              <div key={i} className="flex gap-4 relative">
                {i !== 2 && (
                  <div className="absolute left-[17px] top-10 bottom-[-24px] w-[2px] bg-border/50" />
                )}
                <div className="w-[34px] h-[34px] rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 z-10">
                  <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="pt-1">
                  <p className="text-[13px] text-foreground leading-tight">
                    <span className="font-semibold">{a.name}</span> <span className="text-muted-foreground">{a.action}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sistem Sağlık Durumu Alt Bilgi */}
      <div className="flex items-center gap-2 bg-muted/30 w-fit px-4 py-2 rounded-lg border border-border text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        Sistem Sağlıklı · Uptime: <span className="text-foreground ml-0.5">99.9%</span>
      </div>
    </div>
  );
}
