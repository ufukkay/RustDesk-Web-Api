"use client";

import { useAppStore, Technician } from "@/lib/store";
import { Search, Plus, Mail, Shield, Edit2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function TechniciansPage() {
  const { technicians, addTechnician, deleteTechnician, fetchTechnicians } = useAppStore();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Teknisyen">("Teknisyen");
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      const res = await fetch("/api/technicians/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (res.ok) {
        toast.success("Davet başarıyla gönderildi.");
        setIsInviteOpen(false);
        setInviteEmail("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Davet gönderilemedi.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    }
    setIsInviting(false);
  };

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const handleOpenAdd = () => {
    setIsEdit(false);
    setNewTech({ id: "", name: "", username: "", email: "", role: "Teknisyen", password: "" });
    setIsOpen(true);
  };

  const handleOpenEdit = (tech: Technician) => {
    console.log("Editing technician:", tech);
    setIsEdit(true);
    setNewTech({ 
      id: tech.id, 
      name: tech.name, 
      username: tech.username, 
      email: tech.email, 
      role: tech.role, 
      password: "" 
    });
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    const techData: Technician = {
      id: isEdit ? newTech.id : Math.random().toString(36).substr(2, 9),
      name: newTech.name,
      username: newTech.username,
      email: newTech.email,
      role: newTech.role,
      status: isEdit ? (technicians.find(t => t.id === newTech.id)?.status || "Aktif") : "Aktif",
      lastLogin: isEdit ? (technicians.find(t => t.id === newTech.id)?.lastLogin || "Hiç") : "Hiç",
    };

    // Eğer şifre girildiyse ekleyelim
    if (newTech.password) {
      techData.password = newTech.password;
    }

    await addTechnician(techData);
    setIsOpen(false);
  };

  return (
    <div className="rd2-page">
      {/* Mini stats */}
      <div className="rd2-stats-grid rd2-stats-3">
        {[
          { label: "Toplam", val: technicians.length, sub: "Tümü aktif" },
          { label: "Yönetici", val: technicians.filter(t => t.role === "Admin").length, sub: "Tam yetkili" },
          { label: "Bugün Aktif", val: technicians.length, sub: "Sisteme girenler" },
        ].map((s) => (
          <div key={s.label} className="rd2-stat rd2-stat-mini">
            <div className="rd2-stat-val">{s.val}</div>
            <div className="rd2-stat-label">{s.label}</div>
            <div className="rd2-muted-sm">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="rd2-toolbar">
        <div className="rd2-search rd2-search-lg">
          <Search width="15" height="15" />
          <input placeholder="Teknisyen ara..." />
        </div>
        <div style={{ flex: 1 }} />
        <button className="rd2-btn rd2-btn-ghost" onClick={() => setIsInviteOpen(true)}>
          <Mail width="15" height="15" /> Davet Oluştur
        </button>
        <button className="rd2-btn rd2-btn-primary" style={{ background: "#FFCC00", color: "#0E1116" }} onClick={handleOpenAdd}>
          <Plus width="15" height="15" /> Yeni Teknisyen
        </button>
      </div>

      <section className="rd2-card rd2-card-flush">
        <table className="rd2-table">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>Son Giriş</th>
              <th className="rd2-tr">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {technicians.length === 0 ? (
              <tr>
                <td colSpan={6} className="rd2-empty">Kayıtlı teknisyen bulunmuyor.</td>
              </tr>
            ) : (
              technicians.map((t) => (
                <tr key={t.id} className="rd2-tr-hover">
                  <td>
                    <div className="rd2-device-cell">
                      <div className="rd2-avatar" style={{ background: t.role === "Admin" ? "#FFCC00" : "#F1F2F4", color: t.role === "Admin" ? "#0E1116" : "#5C6573" }}>
                        {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="rd2-device-name">{t.name}</div>
                        <div className="rd2-device-meta">@{t.username || t.email.split("@")[0]}</div>
                      </div>
                    </div>
                  </td>
                  <td className="rd2-cell-muted">{t.email}</td>
                  <td>
                    {t.role === "Admin" ? (
                      <span className="rd2-pill" style={{ background: "#FFCC00", color: "#0E1116" }}>
                        <Shield width="11" height="11" /> Yönetici
                      </span>
                    ) : (
                      <span className="rd2-pill rd2-pill-off">Teknisyen</span>
                    )}
                  </td>
                  <td>
                    <span className="rd2-pill rd2-pill-on">
                      <span className="rd2-dot rd2-dot-green" />{t.status || "Aktif"}
                    </span>
                  </td>
                  <td className="rd2-cell-muted">{t.lastLogin || "Hiç"}</td>
                  <td className="rd2-tr">
                    <div className="rd2-row-actions">
                      <button 
                        className="rd2-icon-btn rd2-icon-btn-sm" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenEdit(t);
                        }}
                        title="Düzenle"
                      >
                        <Edit2 width="13" height="13" />
                      </button>
                      <button 
                        className="rd2-icon-btn rd2-icon-btn-sm rd2-danger" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm(`${t.name} isimli teknisyeni silmek istediğinize emin misiniz?`)) {
                            deleteTechnician(t.id);
                          }
                        }}
                        title="Sil"
                      >
                        <Trash2 width="13" height="13" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Modal */}
      {isOpen && (
        <div className="rd2-overlay" onClick={() => setIsOpen(false)}>
          <div className="rd2-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800 }}>
              {isEdit ? "Teknisyen Hesabını Düzenle" : "Yeni Teknisyen Hesabı"}
            </h3>
            <div className="rd2-form">
              <div className="rd2-field-group">
                <label>Ad Soyad</label>
                <div className="rd2-field">
                  <input type="text" value={newTech.name} onChange={e => setNewTech({ ...newTech, name: e.target.value })} placeholder="Örn: Ahmet Yılmaz" />
                </div>
              </div>
              <div className="rd2-field-group">
                <label>Kullanıcı Adı</label>
                <div className="rd2-field">
                  <input type="text" value={newTech.username} onChange={e => setNewTech({ ...newTech, username: e.target.value })} placeholder="Örn: ahmet" />
                </div>
              </div>
              <div className="rd2-field-group">
                <label>E-posta Adresi</label>
                <div className="rd2-field">
                  <input type="email" value={newTech.email} onChange={e => setNewTech({ ...newTech, email: e.target.value })} placeholder="ahmet@rustdesk.local" />
                </div>
              </div>
              <div className="rd2-field-group">
                <label>{isEdit ? "Yeni Şifre (Boş bırakılırsa değişmez)" : "Şifre"}</label>
                <div className="rd2-field">
                  <input type="password" value={newTech.password} onChange={e => setNewTech({ ...newTech, password: e.target.value })} placeholder="••••••••" />
                </div>
              </div>
              <div className="rd2-field-group">
                <label>Rol</label>
                <div className="rd2-field">
                  <select value={newTech.role} onChange={e => setNewTech({ ...newTech, role: e.target.value as any })}>
                    <option value="Teknisyen">Teknisyen (Sınırlı)</option>
                    <option value="Admin">Admin (Tam Yetki)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="rd2-modal-foot">
              <button className="rd2-btn rd2-btn-ghost" onClick={() => setIsOpen(false)}>İptal</button>
              <button className="rd2-btn rd2-btn-primary" style={{ background: "#FFCC00", color: "#0E1116" }} onClick={handleSubmit}>
                {isEdit ? "Güncelle" : "Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Invitation Modal */}
      {isInviteOpen && (
        <div className="rd2-overlay" onClick={() => setIsInviteOpen(false)}>
          <div className="rd2-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800 }}>
              Teknisyen Davet Et
            </h3>
            <div className="rd2-form">
              <div className="rd2-field-group">
                <label>Davet Edilecek E-posta</label>
                <div className="rd2-field">
                  <Mail width="14" height="14" />
                  <input 
                    type="email" 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    placeholder="ornek@alanadi.com" 
                  />
                </div>
              </div>
              <div className="rd2-field-group">
                <label>Rol</label>
                <div className="rd2-field">
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)}>
                    <option value="Teknisyen">Teknisyen (Sınırlı)</option>
                    <option value="Admin">Admin (Tam Yetki)</option>
                  </select>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#666", marginTop: 10 }}>
                Kişiye bir kurulum linki gönderilecek. Linki kullanarak kendi hesabını oluşturabilecek.
              </p>
            </div>
            <div className="rd2-modal-foot">
              <button className="rd2-btn rd2-btn-ghost" onClick={() => setIsInviteOpen(false)}>İptal</button>
              <button 
                className="rd2-btn rd2-btn-primary" 
                style={{ background: "#FFCC00", color: "#0E1116" }} 
                onClick={handleInvite}
                disabled={isInviting}
              >
                {isInviting ? "Gönderiliyor..." : "Davet Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
