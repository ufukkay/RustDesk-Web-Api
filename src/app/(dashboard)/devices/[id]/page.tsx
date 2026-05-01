"use client";

import { useAppStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { 
  Monitor, Cpu, Database, HardDrive, Activity, 
  ArrowLeft, Play, Shield, Calendar, Clock, 
  User as UserIcon, Globe, Smartphone, Laptop, Server 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { devices, fetchDevices } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDevices();
  }, [fetchDevices]);

  const device = devices.find(d => d.id === params.id);

  if (!mounted) return null;

  if (!device) {
    return (
      <div className="p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Monitor className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Cihaz Bulunamadı</h2>
        <Button onClick={() => router.push("/devices")} variant="outline">Geri Dön</Button>
      </div>
    );
  }

  const stats = [
    { label: "İşlemci (CPU)", value: device.cpu || "Bilinmiyor", icon: Cpu, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Bellek (RAM)", value: device.ram || "Bilinmiyor", icon: Database, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Disk Durumu", value: device.disk || "Bilinmiyor", icon: HardDrive, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "IP Adresi", value: device.ip || "-", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full h-10 w-10 border-border"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-brand-ink tracking-tight">{device.name}</h1>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                device.status === "online" ? "text-emerald-600 bg-emerald-500/10" : "text-muted-foreground bg-secondary"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${device.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                {device.status}
              </div>
            </div>
            <p className="text-muted-foreground font-medium mt-1 uppercase text-xs tracking-widest">Cihaz Kimliği: {device.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            disabled={device.status !== "online"}
            className="bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90 font-black px-8 h-12 rounded-brand shadow-brand-sm group"
            onClick={() => window.location.href = `rustdesk://${device.id}`}
          >
            <Play className="w-5 h-5 mr-2 fill-current group-hover:scale-110 transition-transform" />
            Uzaktan Bağlan
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-card border border-border p-6 rounded-brand-lg shadow-sm hover:shadow-brand transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
                </div>
                <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
              </div>
            ))}
          </div>

          {/* System Details Section */}
          <div className="bg-card border border-border rounded-brand-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-black text-xs uppercase tracking-widest text-brand-ink/70">Sistem Detayları</h3>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-y-6 gap-x-12">
              <DetailItem icon={Monitor} label="İşletim Sistemi" value={device.os} />
              <DetailItem icon={UserIcon} label="Aktif Kullanıcı" value={device.user} />
              <DetailItem icon={Calendar} label="Kayıt Tarihi" value="Bilinmiyor" />
              <DetailItem icon={Clock} label="Son Görülme" value={device.lastSeen} />
              <DetailItem icon={Shield} label="Versiyon" value={device.version || "Bilinmiyor"} />
              <DetailItem icon={Activity} label="Grup" value={device.group || "Genel"} />
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar info */}
        <div className="space-y-6">
          <div className="bg-brand-ink text-white p-8 rounded-brand-lg shadow-brand relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-2">Hızlı Destek</h3>
              <p className="text-white/60 text-sm font-medium mb-6">Bu cihaza anında bağlanarak müdahale edebilirsiniz.</p>
              <Button className="w-full bg-brand-yellow text-brand-ink font-black hover:bg-brand-yellow/90">
                Bağlantı Talebi Gönder
              </Button>
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-yellow/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-card border border-border p-6 rounded-brand-lg space-y-4">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Bağlantı Güvenliği</h3>
            <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
              <Shield className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-[13px] font-bold text-emerald-700 leading-none">Uçtan Uca Şifreli</p>
                <p className="text-[10px] text-emerald-600/70 mt-1 uppercase font-bold">AES-256 Bit</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
