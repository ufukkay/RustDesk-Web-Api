"use client";

import { useState } from "react";
import { Server, Mail, Save, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UpdateChecker } from "@/components/UpdateChecker";

type Tab = "smtp" | "logs" | "updates";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("smtp");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "smtp",    label: "SMTP & Mail" },
    { key: "logs",    label: "Mail Logları" },
    { key: "updates", label: "Güncellemeler" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Sistem Ayarları</h1>
        <p className="text-slate-500 text-sm mt-0.5">SMTP, e-posta bildirimleri ve güncelleme yönetimi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SMTP */}
      {activeTab === "smtp" && (
        <div className="grid xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl ring-1 ring-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">E-Posta Sunucusu (SMTP)</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">SMTP Host</label>
                <Input defaultValue="smtp.firma.com" className="bg-slate-50 border-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1.5">Port</label>
                  <Input defaultValue="587" className="bg-slate-50 border-slate-200" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1.5">Güvenlik</label>
                  <select className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <option>TLS/STARTTLS</option>
                    <option>SSL</option>
                    <option>None</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Kullanıcı Adı (E-posta)</label>
                <Input defaultValue="no-reply@firma.com" className="bg-slate-50 border-slate-200" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Parola / App Password</label>
                <Input type="password" defaultValue="secretpassword" className="bg-slate-50 border-slate-200" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button className="text-sm font-semibold text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  Test Maili Gönder
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 h-fit">
            <div className="flex items-center gap-2 text-blue-700 mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-bold text-sm">Güvenlik Notu</span>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">
              Kişisel şifrenizi değil, e-posta sağlayıcınızdan alacağınız <strong>Uygulama Parolası (App Password)</strong> kullanmanız önerilir. Bu sayede ana hesap şifreniz korunmuş olur.
            </p>
          </div>
        </div>
      )}

      {/* Mail Logs */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-xl ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Gönderilen E-postalar</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { tarih: "Bugün, 14:30",        alici: "admin@firma.com",  konu: "Yeni Teknisyen: Ahmet Yılmaz",  durum: "ok" },
              { tarih: "Dün, 09:15",          alici: "teknik@firma.com", konu: "Güvenlik Uyarısı: SVR-DB-01",   durum: "ok" },
              { tarih: "28 Nisan, 16:45",     alici: "ufuk@firma.com",   konu: "Şifre Sıfırlama İsteği",        durum: "err" },
              { tarih: "27 Nisan, 11:00",     alici: "admin@firma.com",  konu: "Haftalık Özet Raporu",          durum: "ok" },
            ].map(({ tarih, alici, konu, durum }, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{konu}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{alici} · {tarih}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  durum === "ok"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "bg-red-50 text-red-600 ring-1 ring-red-100"
                }`}>
                  {durum === "ok" ? "Başarılı" : "Hata"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Updates */}
      {activeTab === "updates" && <UpdateChecker />}
    </div>
  );
}
