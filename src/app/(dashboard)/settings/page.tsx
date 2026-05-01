"use client";

import { useState } from "react";
import { Mail, Settings as SettingsIcon, Save, Server, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"smtp" | "logs">("smtp");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Ayarlar başarıyla kaydedildi!");
    }, 1000);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sistem Ayarları</h1>
        <p className="text-slate-500 font-medium">SMTP, E-posta bildirimleri ve log konfigürasyonlarını yapılandırın.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          className={`pb-3 text-sm font-bold px-1 border-b-2 transition-colors ${activeTab === "smtp" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          onClick={() => setActiveTab("smtp")}
        >
          <div className="flex items-center gap-2"><Server className="w-4 h-4" /> SMTP & Mail Ayarları</div>
        </button>
        <button 
          className={`pb-3 text-sm font-bold px-1 border-b-2 transition-colors ${activeTab === "logs" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          onClick={() => setActiveTab("logs")}
        >
          <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> Mail Logları</div>
        </button>
      </div>

      <div className="flex-1">
        {activeTab === "smtp" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">E-Posta Sunucu (SMTP)</CardTitle>
                <CardDescription>Sistemin bildirim gönderebilmesi için e-posta ayarlarını girin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input placeholder="smtp.gmail.com" defaultValue="smtp.firma.com" className="bg-slate-50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input placeholder="587" defaultValue="587" className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Güvenlik Protokolü</Label>
                    <select className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950">
                      <option>TLS/STARTTLS</option>
                      <option>SSL</option>
                      <option>None</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Kullanıcı Adı (Email)</Label>
                  <Input placeholder="noreply@firma.com" defaultValue="no-reply@firma.com" className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Parola / App Password</Label>
                  <Input type="password" placeholder="••••••••" defaultValue="secretpassword" className="bg-slate-50" />
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <Button variant="outline" className="text-slate-600 font-semibold">Test Maili Gönder</Button>
                  <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    {isSaving ? "Kaydediliyor..." : <><Save className="w-4 h-4 mr-2" /> Ayarları Kaydet</>}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-100 shadow-sm h-fit">
              <CardHeader>
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <CardTitle className="text-lg">Bilgi</CardTitle>
                </div>
                <p className="text-sm text-blue-800 leading-relaxed font-medium">
                  RustDesk sistemi, yöneticilere yeni bağlantılar ve uyarılarla ilgili anlık e-posta gönderimi yapabilir. Şifre alanı olarak kişisel parolanızı değil, "Uygulama Parolası (App Password)" kullanmanız güvenlik açısından tavsiye edilir.
                </p>
              </CardHeader>
            </Card>
          </div>
        )}

        {activeTab === "logs" && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Son Gönderilen E-postalar (Mail Log)</CardTitle>
              <CardDescription>Sistemden otomatik çıkan uyarı ve bildirim e-postaları geçmişi.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Tarih</th>
                      <th className="px-4 py-3">Alıcı</th>
                      <th className="px-4 py-3">Konu</th>
                      <th className="px-4 py-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                    <tr>
                      <td className="px-4 py-3">Bugün, 14:30</td>
                      <td className="px-4 py-3">admin@firma.com</td>
                      <td className="px-4 py-3">Yeni Teknisyen Eklendi: Ahmet Yılmaz</td>
                      <td className="px-4 py-3"><span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold">Başarılı</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Dün, 09:15</td>
                      <td className="px-4 py-3">teknik@firma.com</td>
                      <td className="px-4 py-3">Güvenlik Uyarısı: SVR-DB-01 Bağlantısı</td>
                      <td className="px-4 py-3"><span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold">Başarılı</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">28 Nisan, 16:45</td>
                      <td className="px-4 py-3">ufuk@firma.com</td>
                      <td className="px-4 py-3">Şifre Sıfırlama İsteği</td>
                      <td className="px-4 py-3"><span className="text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold">Hata (SMTP timeout)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
