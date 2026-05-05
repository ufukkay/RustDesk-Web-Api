"use client";

import { useState, useEffect } from "react";
import { Package, Download, Terminal, Copy, Check, Shield, Globe, Cpu, Info, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

export default function BuilderPage() {
  const { serverConfig } = useAppStore();
  const [host, setHost] = useState(serverConfig.host);
  const [port, setPort] = useState(serverConfig.apiPort);
  const [copied, setCopied] = useState(false);
  const [serverKey, setServerKey] = useState("Yükleniyor...");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    fetch("/api/rustdesk/server-key")
      .then(res => res.json())
      .then(data => setServerKey(data.key))
      .catch(() => setServerKey("Okunamadı"));
    fetch("/api/rustdesk/settings")
      .then(res => res.json())
      .then(data => {
        if (data.idServer || data.host) setHost(data.idServer || data.host);
        if (data.port) setPort(data.port);
        // apiServer ayarlıysa onu kullan (https://rmm.talay.com), yoksa mevcut sayfanın origin'i
        setBaseUrl(data.apiServer || window.location.origin);
      })
      .catch(() => setBaseUrl(window.location.origin));
  }, []);
  const installCommand = `irm "${baseUrl}/api/rustdesk/builder/install?host=${host}&port=${port}" | iex`;

  const copyToClipboard = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Fallback for non-secure contexts (HTTP via IP)
      const textArea = document.createElement("textarea");
      textArea.value = installCommand;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Kopyalama hatası:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const downloads = [
    { name: "Windows (x64)", file: "rustdesk-1.4.6-x86_64.exe", type: "EXE" },
    { name: "Linux (Debian)", file: "rustdesk-1.4.6-x86_64.deb", type: "DEB" },
    { name: "macOS (Intel/M1)", file: "rustdesk-1.4.6-x86_64.dmg", type: "DMG" },
  ];

  return (
    <div className="rd2-page">
      <div className="rd2-builder-grid">
        {/* Config + command */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Config card */}
          <section className="rd2-card">
            <div className="rd2-card-head">
              <div>
                <h3>Dağıtım Yapılandırması</h3>
                <p className="rd2-muted-sm">Sunucu adresi ve port</p>
              </div>
            </div>
            <div className="rd2-form">
              <div className="rd2-form-row">
                <div className="rd2-field-group">
                  <label>Sunucu Host (IP/Domain)</label>
                  <div className="rd2-field">
                    <Globe width="14" height="14" />
                    <input 
                      value={host} 
                      onChange={e => setHost(e.target.value)}
                      placeholder="192.168.x.x"
                    />
                  </div>
                </div>
                <div className="rd2-field-group">
                  <label>API Port</label>
                  <div className="rd2-field">
                    <input 
                      value={port} 
                      onChange={e => setPort(e.target.value)}
                      placeholder="3000"
                    />
                  </div>
                </div>
              </div>
              <div className="rd2-field-group">
                <label>Sunucu Key</label>
                <div className="rd2-field">
                  <Shield width="14" height="14" />
                  <input readOnly value={serverKey} className="rd2-mono" style={{ fontSize: 12 }} />
                </div>
              </div>
            </div>
          </section>

          {/* PowerShell command */}
          <div className="rd2-ps-card" style={{ background: "#0E1116" }}>
            <div className="rd2-ps-head">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Terminal width="16" height="16" style={{ color: "#FFCC00" }} />
                <span style={{ fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,.85)" }}>
                  PowerShell Tek Tık Kurulum
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,.08)", color: "#FFCC00", padding: "2px 8px", borderRadius: 4, letterSpacing: ".06em", textTransform: "uppercase" }}>
                  Önerilen
                </span>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(239,68,68,.6)" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(245,158,11,.6)" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(16,185,129,.6)" }} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.45)", margin: "0 0 14px", lineHeight: 1.5 }}>
              RustDesk 1.4.6'yı indirip yapılandırır, RMM Ajanını servis olarak kurar.
            </p>
            <div className="rd2-ps-cmd">
              <span style={{ color: "rgba(255,255,255,.25)", marginRight: 6 }}>$</span>
              <span className="rd2-mono" style={{ color: "#FFCC00", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {installCommand}
              </span>
              <button className="rd2-copy-btn" style={{ background: "#FFCC00", color: "#0E1116" }} onClick={copyToClipboard}>
                {copied ? <Check width="14" height="14" /> : <Copy width="14" height="14" />}
              </button>
            </div>

            <div className="rd2-ps-uninstall">
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.25)", marginBottom: 8 }}>
                Kaldırma Komutu
              </div>
              <div className="rd2-ps-cmd" style={{ background: "rgba(255,255,255,.04)" }}>
                <span style={{ color: "rgba(255,255,255,.25)", marginRight: 6 }}>$</span>
                <span className="rd2-mono" style={{ color: "#fca5a5", fontSize: 11, flex: 1 }}>
                  {`irm "${baseUrl}/api/rustdesk/builder/uninstall" | iex`}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".05em" }}>
              <span><Shield width="12" height="12" style={{ display: "inline-block", marginRight: 4, color: "#4ade80" }} /> Tam Otomatik</span>
              <span><Cpu width="12" height="12" style={{ display: "inline-block", marginRight: 4, color: "#60a5fa" }} /> RMM Ajanı</span>
              <span><Download width="12" height="12" style={{ display: "inline-block", marginRight: 4, color: "#FFCC00" }} /> v1.4.6</span>
            </div>
          </div>
        </div>

        {/* Individual packages */}
        <section className="rd2-card">
          <div className="rd2-card-head">
            <div>
              <h3>Bireysel Paketler</h3>
              <p className="rd2-muted-sm">Platform bazlı indirme</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {downloads.map(pkg => (
              <div key={pkg.name} className="rd2-pkg-row">
                <div className="rd2-pkg-icon">
                  <Download width="16" height="16" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{pkg.name}</div>
                  <div style={{ fontSize: 11, color: "#8B92A0", marginTop: 2, fontWeight: 600, letterSpacing: ".04em" }}>
                    {pkg.type} dosyası
                  </div>
                </div>
                <button 
                  className="rd2-btn rd2-btn-sm" 
                  style={{ background: "#F1F2F4", color: "#0E1116" }}
                  onClick={() => window.open(`https://github.com/rustdesk/rustdesk/releases/download/1.4.6/${pkg.file}`, '_blank')}
                >
                  İndir
                </button>
              </div>
            ))}
          </div>
          <div className="rd2-pkg-note">
            <Info width="13" height="13" />
            <span>Windows için .exe dosyasının adını değiştirmeyin — otomatik konfigürasyon için gerekli.</span>
          </div>
        </section>
      </div>
    </div>
  );
}
