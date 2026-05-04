"use client";

import { useState, useEffect } from "react";
import { Server, Save, ShieldCheck, Globe, Key, Eye, EyeOff, Activity, Database, Network, Mail, History, Layout, MailCheck, Check } from "lucide-react";
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
    <div className="rd2-page">
      <div className="rd2-tabs">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rd2-tab${activeTab === key ? " on" : ""}`}
            style={activeTab === key ? { borderColor: "#FFCC00", color: "#0E1116" } : {}}
          >
            <Icon width="14" height="14" /> {label}
          </button>
        ))}
      </div>

      {activeTab === "server" && (
        <div className="rd2-2col">
          <section className="rd2-card">
            <div className="rd2-card-head">
              <div>
                <h3>RustDesk Sunucu Yapılandırması</h3>
                <p className="rd2-muted-sm">HBBS, HBBR ve API bağlantı bilgileri</p>
              </div>
            </div>
            <div className="rd2-form">
              <div className="rd2-form-row">
                <div className="rd2-field-group">
                  <label>ID Sunucu (hbbs)</label>
                  <div className="rd2-field">
                    <input 
                      value={settings.idServer} 
                      onChange={e => setSettings({...settings, idServer: e.target.value})}
                      placeholder="192.168.x.x"
                    />
                  </div>
                </div>
                <div className="rd2-field-group">
                  <label>Relay (hbbr)</label>
                  <div className="rd2-field">
                    <input 
                      value={settings.relayServer} 
                      onChange={e => setSettings({...settings, relayServer: e.target.value})}
                      placeholder="192.168.x.x"
                    />
                  </div>
                </div>
              </div>
              <div className="rd2-field-group">
                <label>API Sunucu URL</label>
                <div className="rd2-field">
                  <Globe width="14" height="14" />
                  <input 
                    value={settings.apiServer} 
                    onChange={e => setSettings({...settings, apiServer: e.target.value})}
                    placeholder="http://192.168.x.x:3000"
                  />
                </div>
              </div>
              <div className="rd2-field-group">
                <label>Sunucu Key</label>
                <div className="rd2-field">
                  <Key width="14" height="14" />
                  <input 
                    value={settings.serverKey} 
                    onChange={e => setSettings({...settings, serverKey: e.target.value})}
                    className="rd2-mono" 
                    style={{ fontSize: 11 }} 
                    readOnly
                    placeholder="AAAA..."
                  />
                </div>
              </div>
              <div className="rd2-field-group">
                <label>Varsayılan Şifre</label>
                <div className="rd2-field" style={{ position: "relative" }}>
                  <ShieldCheck width="14" height="14" />
                  <input 
                    type={showPass ? "text" : "password"}
                    value={settings.defaultPassword} 
                    onChange={e => setSettings({...settings, defaultPassword: e.target.value})}
                    placeholder="secretpass"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 10, background: "transparent", border: 0, cursor: "pointer", color: "var(--muted)" }}
                  >
                    {showPass ? <EyeOff width="14" height="14" /> : <Eye width="14" height="14" />}
                  </button>
                </div>
              </div>
              <div className="rd2-form-actions">
                <button 
                  className="rd2-btn rd2-btn-primary" 
                  style={{ background: "#FFCC00", color: "#0E1116" }}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save width="14" height="14" /> {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </section>

          <div className="rd2-info-panel" style={{ background: "#FFCC0018", border: "1px solid #FFCC0044" }}>
            <div className="rd2-info-mark" style={{ background: "#FFCC00", color: "#0E1116" }}>
              <ShieldCheck width="17" height="17" />
            </div>
            <h4>Güvenlik İpucu</h4>
            <p>Sunucu anahtarı (key) her yeniden başlatmada değişebilir. Builder sayfasındaki anahtar her zaman güncel olarak okunur.</p>
            <ul>
              {["hbbs varsayılan port: 21115-21117", "hbbr varsayılan port: 21117", "API portu: 3000"].map((s, i) => (
                <li key={i}>
                  <span className="rd2-tick rd2-tick-sm" style={{ background: "#0E1116", color: "#FFCC00" }}>
                    <Check width="9" height="9" />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "smtp" && (
        <section className="rd2-card">
          <div className="rd2-card-head">
            <div>
              <h3>SMTP & Mail Ayarları</h3>
              <p className="rd2-muted-sm">Bildirim e-postaları bu sunucu üzerinden gönderilir</p>
            </div>
          </div>
          <div className="rd2-form">
            <div className="rd2-form-row">
              <div className="rd2-field-group">
                <label>SMTP Host</label>
                <div className="rd2-field"><input defaultValue="smtp.rustdesk.local" /></div>
              </div>
              <div className="rd2-field-group">
                <label>Port</label>
                <div className="rd2-field"><input defaultValue="587" /></div>
              </div>
            </div>
            <div className="rd2-field-group">
              <label>E-posta</label>
              <div className="rd2-field"><Mail width="14" height="14" /><input defaultValue="no-reply@rustdesk.local" /></div>
            </div>
            <div className="rd2-field-group">
              <label>Şifre / App Password</label>
              <div className="rd2-field"><Key width="14" height="14" /><input type="password" defaultValue="apppassword" /></div>
            </div>
            <div className="rd2-form-actions">
              <button className="rd2-btn rd2-btn-ghost"><Mail width="13" height="13" /> Test Maili</button>
              <button className="rd2-btn rd2-btn-primary" style={{ background: "#FFCC00", color: "#0E1116" }}><Check width="14" height="14" /> Kaydet</button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "logs" && (
        <section className="rd2-card rd2-card-flush">
          <div className="rd2-card-head" style={{ padding: "14px 18px", marginBottom: 0 }}>
            <h3>Mail Logları</h3>
          </div>
          <table className="rd2-table">
            <thead>
              <tr><th>Tarih</th><th>Alıcı</th><th>Konu</th><th>Durum</th></tr>
            </thead>
            <tbody>
              {[
                { t: "Bugün, 14:30", to: "admin@rustdesk.local", subj: "Yeni teknisyen: Selin Demir", ok: true },
                { t: "Dün, 09:15", to: "teknik@rustdesk.local", subj: "Güvenlik uyarısı: SVR-DB-01", ok: true },
                { t: "28 Nis, 16:45", to: "ufuk@rustdesk.local", subj: "Şifre sıfırlama isteği", ok: false },
              ].map((r, i) => (
                <tr key={i} className="rd2-tr-hover">
                  <td className="rd2-cell-muted">{r.t}</td>
                  <td className="rd2-mono">{r.to}</td>
                  <td>{r.subj}</td>
                  <td>
                    {r.ok ? (
                      <span className="rd2-pill rd2-pill-on"><Check width="11" height="11" /> Başarılı</span>
                    ) : (
                      <span className="rd2-pill rd2-pill-bad">Hata</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "updates" && (
        <section className="rd2-card">
          <div className="rd2-card-head"><h3>Güncellemeler</h3></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="rd2-update-row">
              <div>
                <div style={{ fontWeight: 700 }}>RustDesk Portal</div>
                <div className="rd2-muted-sm">Mevcut: v1.0.0</div>
              </div>
              <span className="rd2-pill rd2-pill-on"><Check width="11" height="11" /> Güncel</span>
            </div>
            <div className="rd2-update-row">
              <div>
                <div style={{ fontWeight: 700 }}>RustDesk Core</div>
                <div className="rd2-muted-sm">Mevcut: v1.4.6 · Yeni: v1.4.7</div>
              </div>
              <button className="rd2-btn rd2-btn-sm" style={{ background: "#FFCC00", color: "#0E1116" }}>
                <MailCheck width="13" height="13" /> Güncelle
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
