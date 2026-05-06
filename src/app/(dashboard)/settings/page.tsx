"use client";

import { useState, useEffect } from "react";
import { Server, Save, ShieldCheck, Globe, Key, Eye, EyeOff, Mail, History, MailCheck, Check } from "lucide-react";
import { toast } from "sonner";

type Tab = "server" | "smtp" | "logs" | "updates";

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
    deviceNamePrefix: "SRP-",
    smtpHost: "",
    smtpPort: "",
    smtpEmail: "",
    smtpPassword: ""
  });

  const [updateInfo, setUpdateInfo] = useState({ currentVersion: "1.0.0", latestVersion: "...", updateAvailable: false });
  const [isUpdating, setIsUpdating] = useState(false);

  const checkUpdates = async () => {
    try {
      const res = await fetch("/api/updates");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data && data.currentVersion) {
        setUpdateInfo(data);
      }
    } catch (e) {
      console.error("Update check failed", e);
    }
  };

  const handleRunUpdate = async () => {
    if (!confirm("Sunucu üzerinde 'git pull' işlemi yapılacak. Emin misiniz?")) return;
    setIsUpdating(true);
    try {
      const res = await fetch("/api/updates", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message || "Güncelleme başarısız.");
      }
      checkUpdates();
    } catch (e) {
      toast.error("Güncelleme sırasında hata oluştu.");
    }
    setIsUpdating(false);
  };

  useEffect(() => {
    // Sunucu ayarlarını yükle
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
          deviceNamePrefix: data.deviceNamePrefix || "SRP-",
          smtpHost: data.smtpHost || "smtp.rustdesk.local",
          smtpPort: data.smtpPort || "587",
          smtpEmail: data.smtpEmail || "no-reply@rustdesk.local",
          smtpPassword: data.smtpPassword || ""
        });
      })
      .catch(err => console.error("Settings load error:", err));
    
    // Güncellemeleri de denetle
    checkUpdates();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/rustdesk/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success("Ayarlar başarıyla kaydedildi.");
      } else {
        toast.error("Ayarlar kaydedilemedi.");
      }
    } catch (err) {
      toast.error("Hata oluştu.");
    }
    setIsSaving(false);
  };
  const handleTestMail = async () => {
    console.log("handleTestMail triggered", settings);
    try {
      const res = await fetch("/api/mail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      console.log("Test mail response status:", res.status);
      const data = await res.json();
      if (res.ok) {
        toast.success("Test maili başarıyla gönderildi.");
      } else {
        toast.error("Hata: " + (data.error || "Mail gönderilemedi"));
      }
    } catch (err) {
      console.error("handleTestMail error:", err);
      toast.error("Bağlantı hatası oluştu.");
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "server",  label: "RustDesk Sunucu", icon: Globe },
    { key: "smtp",    label: "SMTP & Mail",     icon: Server },
    { key: "logs",    label: "Mail Logları",    icon: History },
    { key: "updates", label: "Güncellemeler",   icon: MailCheck },
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
                <div className="rd2-field">
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
                    style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--muted)", padding: 0, display: "flex", flexShrink: 0 }}
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
                <div className="rd2-field">
                  <input 
                    value={settings.smtpHost} 
                    onChange={e => setSettings({...settings, smtpHost: e.target.value})}
                    placeholder="smtp.gmail.com"
                  />
                </div>
              </div>
              <div className="rd2-field-group">
                <label>Port</label>
                <div className="rd2-field">
                  <input 
                    value={settings.smtpPort} 
                    onChange={e => setSettings({...settings, smtpPort: e.target.value})}
                    placeholder="587"
                  />
                </div>
              </div>
            </div>
            <div className="rd2-field-group">
              <label>E-posta</label>
              <div className="rd2-field">
                <Mail width="14" height="14" />
                <input 
                  value={settings.smtpEmail} 
                  onChange={e => setSettings({...settings, smtpEmail: e.target.value})}
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div className="rd2-field-group">
              <label>Şifre / App Password</label>
              <div className="rd2-field">
                <Key width="14" height="14" />
                <input 
                  type="password" 
                  value={settings.smtpPassword} 
                  onChange={e => setSettings({...settings, smtpPassword: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="rd2-form-actions">
              <button 
                type="button"
                className="rd2-btn rd2-btn-ghost"
                onClick={handleTestMail}
              >
                <Mail width="13" height="13" /> Test Maili
              </button>
              <button 
                type="button"
                className="rd2-btn rd2-btn-primary" 
                style={{ background: "#FFCC00", color: "#0E1116" }}
                onClick={handleSave}
                disabled={isSaving}
              >
                <Check width="14" height="14" /> {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
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
          <div className="rd2-card-head">
            <div>
              <h3>Sistem Güncellemeleri</h3>
              <p className="rd2-muted-sm">Portal ve Core bileşenleri kontrol edilir</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="rd2-update-row">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="rd2-avatar" style={{ background: "#F1F2F4", color: "#5C6573" }}>RD</div>
                <div>
                  <div style={{ fontWeight: 700 }}>RustDesk Portal</div>
                  <div className="rd2-muted-sm">Mevcut: {updateInfo.currentVersion} {updateInfo.updateAvailable && <span style={{ color: "#C0392B" }}>(Yeni: {updateInfo.latestVersion})</span>}</div>
                </div>
              </div>
              {updateInfo.updateAvailable ? (
                <button 
                  className="rd2-btn rd2-btn-sm" 
                  style={{ background: "#FFCC00", color: "#0E1116" }}
                  onClick={handleRunUpdate}
                  disabled={isUpdating}
                >
                  <MailCheck width="13" height="13" /> {isUpdating ? "Güncelleniyor..." : "Şimdi Güncelle"}
                </button>
              ) : (
                <span className="rd2-pill rd2-pill-on"><Check width="11" height="11" /> Güncel</span>
              )}
            </div>

            <div style={{ padding: "16px", background: "#F1F2F4", borderRadius: "10px", fontSize: "12.5px" }}>
              <div style={{ fontWeight: 800, marginBottom: "6px" }}>Otomatik Güncelleme Hakkında</div>
              <p className="rd2-cell-muted" style={{ lineHeight: 1.5 }}>
                "Şimdi Güncelle" butonu sunucu üzerinde <code>git pull</code> komutunu çalıştırır. 
                Değişikliklerin aktif olması için sunucuda projenin yeniden derlenmesi (build) gerekebilir.
              </p>
            </div>

            <div className="rd2-form-actions" style={{ marginTop: 0, paddingTop: 0, border: 0 }}>
              <button 
                className="rd2-btn rd2-btn-ghost rd2-btn-sm" 
                onClick={checkUpdates}
                disabled={isUpdating}
              >
                <History width="13" height="13" /> Şimdi Denetle
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
