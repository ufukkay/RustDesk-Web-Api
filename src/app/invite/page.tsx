"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, User, Key, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (!token) {
      setError("Geçersiz davet linki.");
      setLoading(false);
      return;
    }

    fetch(`/api/technicians/invite/verify?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setInviteData(data);
        }
      })
      .catch(() => setError("Sunucuya bağlanılamadı."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Şifreler uyuşmuyor.");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/technicians/invite/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: formData.name,
          username: formData.username,
          password: formData.password
        })
      });

      if (res.ok) {
        toast.success("Hesabınız başarıyla oluşturuldu! Giriş yapabilirsiniz.");
        router.push("/login");
      } else {
        const data = await res.json();
        toast.error(data.error || "Bir hata oluştu.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    }
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="rd2-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Loader2 className="animate-spin" width={40} height={40} color="#FFCC00" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rd2-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", padding: 20 }}>
        <div className="rd2-card" style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{ color: "#E74C3C", marginBottom: 20 }}>
             <Shield width={60} height={60} style={{ margin: "0 auto" }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Hata!</h2>
          <p style={{ color: "#666", marginTop: 10 }}>{error}</p>
          <button 
            className="rd2-btn rd2-btn-primary" 
            style={{ marginTop: 20, width: "100%", background: "#FFCC00", color: "#0E1116" }}
            onClick={() => router.push("/login")}
          >
            Giriş Sayfasına Git
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rd2-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px" }}>
      <div className="rd2-card" style={{ maxWidth: 450, width: "100%", padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ background: "#FFCC00", color: "#0E1116", width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px" }}>
            <User width={30} height={30} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Hoş Geldiniz!</h1>
          <p style={{ color: "#666", marginTop: 5 }}>{inviteData?.email} için hesap kurulumu</p>
        </div>

        <form className="rd2-form" onSubmit={handleSubmit}>
          <div className="rd2-field-group">
            <label>Ad Soyad</label>
            <div className="rd2-field">
              <User width={16} height={16} />
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>
          </div>

          <div className="rd2-field-group">
            <label>Kullanıcı Adı</label>
            <div className="rd2-field">
              <Shield width={16} height={16} />
              <input 
                required
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                placeholder="ahmet123"
              />
            </div>
          </div>

          <div className="rd2-field-group">
            <label>Şifre Oluşturun</label>
            <div className="rd2-field">
              <Key width={16} height={16} />
              <input 
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="rd2-field-group">
            <label>Şifreyi Onaylayın</label>
            <div className="rd2-field">
              <Check width={16} height={16} />
              <input 
                type="password"
                required
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="rd2-btn rd2-btn-primary" 
            style={{ width: "100%", background: "#FFCC00", color: "#0E1116", marginTop: 20, height: 45 }}
            disabled={verifying}
          >
            {verifying ? "Hesabınız Oluşturuluyor..." : "Kurulumu Tamamla"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <InviteContent />
    </Suspense>
  );
}
