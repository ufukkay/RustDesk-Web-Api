"use client";

import { useState, useEffect } from "react";
import { Server, Save, ShieldCheck, Globe, Key, Eye, EyeOff, Activity, Database, Network, Mail, History, Layout, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UpdateChecker } from "@/components/UpdateChecker";

type Tab = "server" | "smtp" | "logs" | "updates" | "brand";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("server");
  const [isSaving, setIsSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  const [settings, setSettings] = useState({
    host: "",
    port: "",
    idServer: "",
    relayServer: "",
    apiServer: "",
    serverKey: "",
    defaultPassword: "",
    deviceNamePrefix: "SRP-"
  });

  useEffect(() => {
    fetch("/api/rustdesk/settings")
      .then(res => res.json())
      .then(data => {
        setSettings({
          host: data.host || "",
          port: data.port || "",
          idServer: data.idServer || data.host || "",
          relayServer: data.relayServer || data.host || "",
          apiServer: data.apiServer || `http://${data.host}:${data.port}`,
          serverKey: data.serverKey || "",
          defaultPassword: data.defaultPassword || "",
          deviceNamePrefix: data.deviceNamePrefix || "SRP-"
        });
      })
      .catch(err => console.error("Settings load error:", err));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/rustdesk/settings", {
        method: "POST",
        body: JSON.stringify(settings)
      });
      if (res.ok) alert("Ayarlar başarıyla kaydedildi.");
    } catch (err) {
      alert("Hata oluştu.");
    }
    setIsSaving(false);
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "server",  label: "RustDesk Sunucu", icon: Globe },
    { key: "smtp",    label: "SMTP & Mail",     icon: Server },
    { key: "logs",    label: "Mail Logları",    icon: History },
    { key: "updates", label: "Güncellemeler",   icon: MailCheck },
    { key: "brand",   label: "Görünüm",         icon: Layout },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Sistem Ayarları</h1>
        <p className="text-sm text-muted-foreground">Portal konfigürasyonunu ve bağlantıları yönetin.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-3 text-xs font-semibold transition-all flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-md"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl">
        {activeTab === "server" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm uppercase">RustDesk Sunucu Yapılandırması</h3>
                </div>
                
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">ID Sunucu (hbbs)</Label>
                      <Input 
                        value={settings.idServer} 
                        onChange={e => setSettings({...settings, idServer: e.target.value})}
                        className="bg-secondary/30" 
                        placeholder="Örn: 192.168.0.184"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Relay Sunucu (hbbr)</Label>
                      <Input 
                        value={settings.relayServer} 
                        onChange={e => setSettings({...settings, relayServer: e.target.value})}
                        className="bg-secondary/30" 
                        placeholder="Örn: 192.168.0.184"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">API Sunucu (Dashboard URL)</Label>
                      <Input 
                        value={settings.apiServer} 
                        onChange={e => setSettings({...settings, apiServer: e.target.value})}
                        className="bg-secondary/30" 
                        placeholder="Örn: http://192.168.0.184:3000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Sunucu Key</Label>
                      <Input 
                        value={settings.serverKey} 
                        onChange={e => setSettings({...settings, serverKey: e.target.value})}
                        className="bg-secondary/30 font-mono text-xs" 
                        placeholder="Public key içeriği"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Varsayılan Bağlantı Şifresi</Label>
                    <div className="relative">
                      <Input 
                        type={showPass ? "text" : "password"}
                        value={settings.defaultPassword} 
                        onChange={e => setSettings({...settings, defaultPassword: e.target.value})}
                        className="pr-10 bg-secondary/30" 
                        placeholder="Örn: Ban41kam5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-6 border-t border-border">
                    <Button onClick={handleSave} disabled={isSaving} className="font-bold">
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Kaydediliyor..." : "Ayarları Kaydet"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "smtp" && (
          <div className="bg-card rounded-xl border border-border p-8">
            <h3 className="font-bold mb-4">SMTP Ayarları</h3>
            <p className="text-sm text-muted-foreground italic">Yakında eklenecek...</p>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-card rounded-xl border border-border p-8">
            <h3 className="font-bold mb-4">Mail Logları</h3>
            <p className="text-sm text-muted-foreground italic">Henüz kayıt yok.</p>
          </div>
        )}

        {activeTab === "updates" && <UpdateChecker />}

        {activeTab === "brand" && (
          <div className="bg-card rounded-xl border border-border p-8">
            <h3 className="font-bold mb-4">Görünüm Ayarları</h3>
            <p className="text-sm text-muted-foreground italic">Yakında eklenecek...</p>
          </div>
        )}
      </div>
    </div>
  );
}
