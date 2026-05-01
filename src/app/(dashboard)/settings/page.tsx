"use client";

import { useState } from "react";
import { Server, Mail, Save, ShieldCheck, MailCheck, AlertCircle, History, Layout, Globe, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UpdateChecker } from "@/components/UpdateChecker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

type Tab = "server" | "smtp" | "logs" | "updates" | "brand";

export default function SettingsPage() {
  const { serverConfig, setServerConfig } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("server");
  const [isSaving, setIsSaving] = useState(false);
  
  const [localServer, setLocalServer] = useState(serverConfig);

  const handleSave = () => {
    setIsSaving(true);
    setServerConfig(localServer);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
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
      {/* Title */}
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

      <div className="max-w-4xl">
        {/* Server Settings */}
        {activeTab === "server" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm uppercase">Sunucu Bağlantısı</h3>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Sunucu IP / Host</Label>
                      <Input 
                        value={localServer.host} 
                        onChange={e => setLocalServer({...localServer, host: e.target.value})}
                        className="bg-secondary/50 border-border h-10" 
                        placeholder="192.168.0.184"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">API Port</Label>
                        <Input 
                          value={localServer.apiPort} 
                          onChange={e => setLocalServer({...localServer, apiPort: e.target.value})}
                          className="bg-secondary/50 border-border h-10" 
                          placeholder="3000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Protokol</Label>
                        <select className="flex h-10 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <option>HTTP</option>
                          <option>HTTPS</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">API Token / Key (Opsiyonel)</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="password"
                          value={localServer.token} 
                          onChange={e => setLocalServer({...localServer, token: e.target.value})}
                          className="bg-secondary/50 border-border h-10 pl-10" 
                          placeholder="API Anahtarı"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <AlertCircle className="w-3.5 h-3.5 text-primary" />
                      Değişikliklerin etkili olması için kaydetmelisiniz.
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-primary text-primary-foreground font-semibold h-10 px-8 rounded-md shadow-sm"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Kaydediliyor..." : "Ayarları Kaydet"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
                <div className="flex items-center gap-2 text-primary mb-4">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-semibold text-xs uppercase tracking-tight">Bağlantı Notu</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  RustDesk sunucunuzun API portunun (genelde 3000 veya 21118) dış dünyaya veya bu panele açık olduğundan emin olun.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SMTP */}
        {activeTab === "smtp" && (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-8">
            <div className="flex items-center gap-2 mb-6">
              <Server className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">SMTP Ayarları</h3>
            </div>
            <p className="text-sm text-muted-foreground">E-posta bildirim ayarlarını buradan yapabilirsiniz.</p>
          </div>
        )}

        {/* Logs */}
        {activeTab === "logs" && (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-8 text-center text-muted-foreground italic">
            Henüz kayıt bulunmuyor.
          </div>
        )}

        {/* Updates */}
        {activeTab === "updates" && <UpdateChecker />}

        {/* Appearance / Brand */}
        {activeTab === "brand" && (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-8">
             <p className="text-sm text-muted-foreground">Görünüm ayarları yakında eklenecek.</p>
          </div>
        )}
      </div>
    </div>
  );
}
