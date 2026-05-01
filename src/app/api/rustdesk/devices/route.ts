import { NextResponse } from "next/server";

export async function GET() {
  const HOST = "http://192.168.0.184:3000";
  const USERNAME = "admin";
  const PASSWORDS = ["admin", "Ban41kam5"]; // İki şifreyi de deneyeceğiz

  let token = null;

  for (const password of PASSWORDS) {
    try {
      console.log(`[RUSTDESK AUTH] Giriş deneniyor (${password})...`);
      
      const loginRes = await fetch(`${HOST}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: USERNAME,
          password: password,
          id: "rustdesk-portal",
          device_name: "Admin Portal"
        })
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        token = loginData.access_token || loginData.token || loginData.data?.token;
        if (token) {
          console.log(`[RUSTDESK AUTH] Giriş BAŞARILI! Şifre: ${password}`);
          break; 
        }
      } else {
        console.warn(`[RUSTDESK AUTH] ${password} şifresi ile giriş yapılamadı: ${loginRes.status}`);
      }
    } catch (e: any) {
      console.error("[RUSTDESK AUTH] Bağlantı Hatası:", e.message);
    }
  }

  if (!token) {
    console.error("[RUSTDESK AUTH] Hiçbir şifre ile giriş yapılamadı!");
    return NextResponse.json({ error: "Giriş başarısız" }, { status: 401 });
  }

  try {
    // Token ile Cihazları Çek
    const devicesRes = await fetch(`${HOST}/api/devices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    let data;
    if (!devicesRes.ok) {
      console.log("[RUSTDESK API] /api/devices bulunamadı, /api/ab deneniyor...");
      const abRes = await fetch(`${HOST}/api/ab`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!abRes.ok) throw new Error("Veri çekilemedi.");
      data = await abRes.json();
    } else {
      data = await devicesRes.json();
    }

    return NextResponse.json(formatDevices(data));
  } catch (error: any) {
    console.error("[RUSTDESK API ERROR]:", error.message);
    return NextResponse.json([]);
  }
}

function formatDevices(data: any) {
  const list = Array.isArray(data) ? data : (data.data || data.list || []);
  return list.map((d: any) => ({
    id: d.id || d.guid || "-",
    name: d.hostname || d.name || d.alias || "Cihaz",
    os: d.os || "Windows",
    user: d.username || d.alias || "-",
    status: d.online || d.status === "online" ? "online" : "offline",
    lastSeen: d.updated_at || "Şimdi",
    ip: d.ip || "-",
    group: d.group || "Genel"
  }));
}
