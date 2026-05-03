"use client";

import { useState, useEffect } from "react";
import { Server, Save, ShieldCheck, Globe, Key, Eye, EyeOff, Activity, Database, Network } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
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
        // Varsayılan değerleri doldur
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

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Sistem Ayarları</h1>
        <p className="text-sm text-muted-foreground">Kurulum dosyasına ve sisteme enjekte edilecek sunucu bilgilerini yönetin.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm uppercase">RustDesk Sunucu Yapılandırması</h3>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Ana Bağlantı Grubu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">ID Sunucu (hbbs)</Label>
                  <div className="relative group">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={settings.idServer} 
                      onChange={e => setSettings({...settings, idServer: e.target.value})}
                      className="pl-10 bg-secondary/30" 
                      placeholder="Örn: 192.168.0.184"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Relay Sunucu (hbbr)</Label>
                  <div className="relative group">
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={settings.relayServer} 
                      onChange={e => setSettings({...settings, relayServer: e.target.value})}
                      className="pl-10 bg-secondary/30" 
                      placeholder="Örn: 192.168.0.184"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">API Sunucu (Dashboard URL)</Label>
                  <div className="relative group">
                    <Network className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={settings.apiServer} 
                      onChange={e => setSettings({...settings, apiServer: e.target.value})}
                      className="pl-10 bg-secondary/30" 
                      placeholder="Örn: http://192.168.0.184:3000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Sunucu Key (id_ed25519.pub)</Label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={settings.serverKey} 
                      onChange={e => setSettings({...settings, serverKey: e.target.value})}
                      className="pl-10 bg-secondary/30 font-mono text-xs" 
                      placeholder="Public key içeriğini buraya yapıştırın"
                    />
                  </div>
                </div>
              </div>

              {/* Güvenlik Grubu */}
              <div className="space-y-2 pt-4 border-t border-border">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Varsayılan Bağlantı Şifresi</Label>
                <div className="relative group">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type={showPass ? "text" : "password"}
                    value={settings.defaultPassword} 
                    onChange={e => setSettings({...settings, defaultPassword: e.target.value})}
                    className="pl-10 pr-10 bg-secondary/30" 
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
                <p className="text-[10px] text-muted-foreground">Bu şifre kurulum sırasında cihazlara otomatik atanır.</p>
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-border">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary text-primary-foreground font-bold h-11 px-10 rounded-lg shadow-md hover:opacity-90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Kaydediliyor..." : "Sistem Ayarlarını Kaydet"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
            <div className="flex items-center gap-2 text-primary mb-4 font-bold uppercase text-xs tracking-widest">
              <Activity className="w-4 h-4" />
              <span>Bilgi</span>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Burada yapacağınız değişiklikler hem yeni oluşturulacak **kurulum scriptine** otomatik olarak yansıtılır, hem de mevcut dashboard bağlantılarını etkiler.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
