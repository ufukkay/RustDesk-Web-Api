"use client";

import { useState } from "react";
import { Server, Mail, Save, ShieldCheck, MailCheck, AlertCircle, History, Layout } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UpdateChecker } from "@/components/UpdateChecker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Tab = "smtp" | "logs" | "updates" | "brand";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("smtp");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "smtp",    label: "SMTP & Mail",  icon: Server },
    { key: "logs",    label: "Mail Logları", icon: History },
    { key: "updates", label: "Güncellemeler", icon: MailCheck },
    { key: "brand",   label: "Görünüm",      icon: Layout },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-brand-ink">Sistem Ayarları</h1>
        <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Konfigürasyon ve Yönetim</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-brand-ink/10">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-3 text-[13px] font-black transition-all flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === key
                ? "border-brand-yellow text-brand-ink"
                : "border-transparent text-slate-400 hover:text-brand-ink hover:bg-brand-ink/5 rounded-t-lg"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl">
        {/* SMTP */}
        {activeTab === "smtp" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-brand-lg border border-brand-ink/5 shadow-brand-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-brand-ink/5 bg-brand-bg/10 flex items-center gap-2">
                  <Server className="w-4 h-4 text-brand-ink" />
                  <h3 className="font-black text-brand-ink text-sm uppercase tracking-tight">SMTP Sunucu Bilgileri</h3>
                </div>
                <div className="p-7 space-y-5">
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <Label className="text-[12px] font-black text-brand-ink uppercase">SMTP Host</Label>
                      <Input defaultValue="smtp.rustdesk.local" className="bg-brand-bg/30 border-brand-ink/10 h-11" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[12px] font-black text-brand-ink uppercase">Port</Label>
                        <Input defaultValue="587" className="bg-brand-bg/30 border-brand-ink/10 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[12px] font-black text-brand-ink uppercase">Güvenlik</Label>
                        <select className="flex h-11 w-full rounded-lg border border-brand-ink/10 bg-brand-bg/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow">
                          <option>TLS / STARTTLS</option>
                          <option>SSL / PURE</option>
                          <option>NONE</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[12px] font-black text-brand-ink uppercase">Kullanıcı Adı (E-posta)</Label>
                      <Input defaultValue="no-reply@rustdesk.local" className="bg-brand-bg/30 border-brand-ink/10 h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[12px] font-black text-brand-ink uppercase">Uygulama Parolası</Label>
                      <Input type="password" defaultValue="secretpassword" className="bg-brand-bg/30 border-brand-ink/10 h-11" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-brand-ink/5 mt-4">
                    <Button variant="outline" className="h-10 text-[12px] font-black border-brand-ink/10 px-4 rounded-brand">
                      Test Maili Gönder
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90 font-black h-10 px-6 rounded-brand shadow-brand-sm"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Kaydediliyor..." : "Ayarları Kaydet"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Side */}
            <div className="space-y-6">
              <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-brand-lg p-6 relative overflow-hidden">
                <div className="flex items-center gap-2 text-brand-ink mb-4">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-black text-[13px] uppercase tracking-tight">Güvenlik Notu</span>
                </div>
                <p className="text-[13px] text-slate-700 font-medium leading-relaxed mb-4">
                  E-posta sunucunuz için <strong>Uygulama Parolası (App Password)</strong> kullanmanız şiddetle önerilir.
                </p>
                <ul className="space-y-3">
                  {[
                    "2FA olan hesaplarda zorunludur",
                    "Hesap şifrenizden bağımsızdır",
                    "İstenildiği an iptal edilebilir"
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                      <div className="w-4 h-4 rounded-full bg-brand-ink text-brand-yellow flex items-center justify-center shrink-0">
                        <Save className="w-2.5 h-2.5" />
                      </div>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Mail Logs */}
        {activeTab === "logs" && (
          <div className="bg-white rounded-brand-lg border border-brand-ink/5 shadow-brand-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-brand-ink/5 bg-brand-bg/10 flex items-center justify-between">
              <div>
                <h3 className="font-black text-brand-ink text-sm uppercase tracking-tight">Gönderilen E-postalar</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Son 100 Kayıt</p>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-brand-ink rounded-lg">
                <History className="w-4 h-4" />
              </Button>
            </div>
            <div className="divide-y divide-brand-ink/5">
              {[
                { tarih: "Bugün, 14:30",        alici: "admin@talay.com",  konu: "Yeni Teknisyen: Selin Demir",  durum: "ok" },
                { tarih: "Bugün, 11:08",        alici: "ufuk@talay.com",   konu: "Çevrimdışı: DEPO-TERMINAL",   durum: "ok" },
                { tarih: "Dün, 09:15",          alici: "teknik@talay.com", konu: "Güvenlik: SVR-DB-01",          durum: "ok" },
                { tarih: "28 Nisan, 16:45",     alici: "ufuk@talay.com",   konu: "Şifre Sıfırlama İsteği",        durum: "err" },
              ].map(({ tarih, alici, konu, durum }, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-6 hover:bg-brand-bg/10 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-black text-brand-ink truncate">{konu}</p>
                    <p className="text-[11px] text-slate-400 font-bold mt-1 tracking-tight">{alici} · {tarih}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight ${
                    durum === "ok" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-red-50 text-red-700 ring-1 ring-red-100"
                  }`}>
                    {durum === "ok" ? <MailCheck className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {durum === "ok" ? "BAŞARILI" : "HATA"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Updates */}
        {activeTab === "updates" && <UpdateChecker />}

        {/* Appearance / Brand */}
        {activeTab === "brand" && (
          <div className="bg-white rounded-brand-lg border border-brand-ink/5 shadow-brand-sm overflow-hidden p-8 space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-brand-ink text-sm uppercase tracking-tight">Görünüm Ayarları</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Panel Kimlik Yönetimi</p>
              </div>
            </div>
            
            <div className="grid gap-6 max-w-xl">
              <div className="space-y-2">
                <Label className="text-[12px] font-black text-brand-ink uppercase">Marka Adı</Label>
                <Input defaultValue="RustDesk Portal" className="bg-brand-bg/30 border-brand-ink/10 h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-black text-brand-ink uppercase">Alt Başlık</Label>
                <Input defaultValue="Uzaktan Destek Sistemi" className="bg-brand-bg/30 border-brand-ink/10 h-11" />
              </div>
              <div className="space-y-4">
                <Label className="text-[12px] font-black text-brand-ink uppercase">Marka Rengi</Label>
                <div className="flex gap-3">
                  {["#FFCC00", "#FFD400", "#F5A524", "#0E1116", "#3B82F6"].map(c => (
                    <button key={c} className={`w-10 h-10 rounded-xl border-2 transition-transform hover:scale-110 ${c === "#FFCC00" ? "border-brand-ink shadow-brand" : "border-brand-ink/5"}`} style={{ background: c }} />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 font-bold italic mt-2">Aktif renk paleti: RustDesk Yellow (#FFCC00)</p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-brand-ink/5 flex justify-end">
              <Button className="bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90 font-black h-10 px-8 rounded-brand shadow-brand-sm">
                Görünümü Güncelle
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
