"use client";

import { useState, useEffect } from "react";
import { Package, Download, Terminal, Copy, Check, Shield, Globe, Cpu, Info, ExternalLink, Zap, Settings2, Image as ImageIcon, FileArchive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

export default function BuilderPage() {
  const { serverConfig } = useAppStore();
  const [host, setHost] = useState("");
  const [copied, setCopied] = useState(false);
  const [serverKey, setServerKey] = useState("Yükleniyor...");
  const [baseUrl, setBaseUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.hostname);
      setBaseUrl(window.location.origin);
    }

    fetch("/api/rustdesk/server-key")
      .then(res => res.json())
      .then(data => setServerKey(data.key))
      .catch(() => setServerKey("Okunamadı"));

    fetch("/api/rustdesk/settings")
      .then(res => res.json())
      .then(data => {
        const isOldDefault = data.host === "192.168.0.184";
        const isOnPublicDomain = window.location.hostname !== "localhost" && !window.location.hostname.startsWith("192.168.");

        if (data.idServer || data.host) {
          if (!(isOldDefault && isOnPublicDomain)) {
            setHost(data.idServer || data.host);
          }
        }

        if (data.apiServer && !(data.apiServer.includes("192.168.0.184") && isOnPublicDomain)) {
          setBaseUrl(data.apiServer);
        }
      })
      .catch(() => {});
  }, []);

  const installCommand = `irm "${baseUrl}/api/rustdesk/builder/install?host=${host}&port=443" | iex`;

  const copyToClipboard = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
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

  const handleGenerateCustomClient = async () => {
    if (!companyName.trim()) {
      toast.error("Lütfen bir şirket/kurum adı giriniz.");
      return;
    }
    setIsGenerating(true);
    try {
      const formData = {
        companyName,
        host,
        serverKey,
        logo: logoPreview
      };

      const response = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Üretim hatası");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${companyName.replace(/\\s+/g, '_')}_Kurulum.exe`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Özel istemci başarıyla üretildi ve indiriliyor.");
    } catch (error: any) {
      console.error(error);
      toast.error(`İstemci üretilirken bir hata oluştu: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Logo boyutu 1MB'dan küçük olmalıdır.");
        return;
      }
      setSelectedLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
                <p className="rd2-muted-sm">Sunucu adresi</p>
              </div>
            </div>
            <div className="rd2-form">
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

      {/* Custom Client Builder Section */}
      <div style={{ marginTop: 24 }}>
        <section className="rd2-card">
          <div className="rd2-card-head" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "#FFCC00", color: "#0E1116", padding: 8, borderRadius: 8 }}>
                <Settings2 width="20" height="20" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0E1116" }}>Özel İstemci Oluşturucu (White-label)</h3>
                <p className="rd2-muted-sm" style={{ margin: "4px 0 0" }}>Şirket kimliğinize özel RustDesk paketi oluşturun</p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div className="rd2-form">
              <div className="rd2-field-group">
                <label>Şirket / Kurum Adı</label>
                <div className="rd2-field">
                  <input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Örn: Talay Teknoloji"
                  />
                </div>
                <p style={{ fontSize: 11, color: "#8B92A0", marginTop: 6 }}>Bu isim kurulan serviste ve masaüstü kısayolunda görünecektir.</p>
              </div>

              <div className="rd2-field-group">
                <label>Şirket Logosu (.ico / .png)</label>
                <div
                  className="rd2-field"
                  style={{
                    background: "rgba(0,0,0,0.02)",
                    borderStyle: "dashed",
                    justifyContent: "center",
                    padding: logoPreview ? "12px" : "24px 0",
                    cursor: "pointer",
                    position: "relative"
                  }}
                  onClick={() => document.getElementById("logo-upload")?.click()}
                >
                  <input
                    id="logo-upload"
                    type="file"
                    accept=".ico,.png,.jpg"
                    onChange={handleLogoChange}
                    style={{ display: "none" }}
                  />
                  {logoPreview ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <img src={logoPreview} alt="Logo Preview" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 4 }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0E1116" }}>
                        {selectedLogo?.name}
                        <div style={{ color: "#8B92A0", fontWeight: 500, fontSize: 10 }}>Değiştirmek için tıklayın</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#8B92A0" }}>
                      <ImageIcon width="24" height="24" />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Logoyu seçmek için tıklayın</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: "#F8F9FA", borderRadius: 12, padding: 20, border: "1px solid rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px", color: "#0E1116" }}>Paket İçeriği</h4>
                <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#4A5568", fontWeight: 600 }}>
                    <Check width="14" height="14" style={{ color: "#10B981" }} /> Önceden yapılandırılmış ID ve Relay Sunucusu
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#4A5568", fontWeight: 600 }}>
                    <Check width="14" height="14" style={{ color: "#10B981" }} /> Otomatik API entegrasyonu
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#4A5568", fontWeight: 600 }}>
                    <Check width="14" height="14" style={{ color: "#10B981" }} /> Arka planda sessiz kurulum (RMM Agent)
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#4A5568", fontWeight: 600 }}>
                    <Check width="14" height="14" style={{ color: "#10B981" }} /> Şirket adınızla özelleştirilmiş PowerShell Scripti
                  </li>
                </ul>
              </div>

              <button
                onClick={handleGenerateCustomClient}
                disabled={isGenerating}
                className="rd2-btn"
                style={{ background: "#0E1116", color: "#fff", width: "100%", marginTop: 24, display: "flex", justifyContent: "center", gap: 8 }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 width="16" height="16" className="animate-spin" />
                    Paket Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <FileArchive width="16" height="16" />
                    Özel Paketi Üret ve İndir (.exe)
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
