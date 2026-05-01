import { NextResponse } from "next/server";

export async function GET() {
  const HOST = "http://192.168.0.184:3000";
  const USERNAME = "admin";
  const PASSWORD = "admin";

  try {
    console.log("[RUSTDESK AUTH] Giriş yapılıyor...");
    
    // 1. Sunucuya Giriş Yap ve Token Al
    const loginRes = await fetch(`${HOST}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD,
        id: "rustdesk-portal",
        device_name: "Admin Portal"
      })
    });

    if (!loginRes.ok) {
      const errorText = await loginRes.text();
      console.error("[RUSTDESK AUTH] Giriş Başarısız:", loginRes.status, errorText);
      return NextResponse.json({ error: "Giriş yapılamadı" }, { status: 401 });
    }

    const loginData = await loginRes.json();
    const token = loginData.access_token || loginData.token || loginData.data?.token;

    if (!token) {
      console.error("[RUSTDESK AUTH] Token alınamadı!");
      return NextResponse.json({ error: "Token alınamadı" }, { status: 500 });
    }

    console.log("[RUSTDESK AUTH] Giriş başarılı, cihazlar çekiliyor...");

    // 2. Token ile Cihazları/Adres Defterini Çek
    // RustDesk Pro/Community genelde /api/devices veya /api/ab kullanır
    const devicesRes = await fetch(`${HOST}/api/devices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!devicesRes.ok) {
      // Eğer /api/devices yoksa /api/ab dene
      const abRes = await fetch(`${HOST}/api/ab`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!abRes.ok) throw new Error("Cihaz listesi çekilemedi.");
      
      const abData = await abRes.json();
      return NextResponse.json(formatDevices(abData));
    }

    const devicesData = await devicesRes.json();
    return NextResponse.json(formatDevices(devicesData));

  } catch (error: any) {
    console.error("[RUSTDESK API ERROR]:", error.message);
    return NextResponse.json([]);
  }
}

// Gelen veriyi portal formatına çeviren yardımcı fonksiyon
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
