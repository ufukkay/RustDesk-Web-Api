import { NextResponse } from "next/server";

export async function GET() {
  const HOST = "http://192.168.0.184:3000";
  // RustDesk'in yaygın kullandığı iki farklı uç nokta:
  const ENDPOINTS = ["/api/devices", "/api/ab"]; 
  const KEY = "5XE+DKQ46fl1EgSLWqKV9qkV+nGT4VLBrhJKYUrFbD0=";

  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`Deneniyor: ${HOST}${endpoint}`);
      const response = await fetch(`${HOST}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEY}` // Key değerini bearer olarak deniyoruz
        },
        next: { revalidate: 0 } 
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Başarılı: ${endpoint}`);
        
        // Veri formatını standardize etme
        const rawDevices = Array.isArray(data) ? data : (data.data || data.list || []);
        
        if (rawDevices.length > 0) {
          const devices = rawDevices.map((device: any) => ({
            id: device.id || device.guid || "-",
            name: device.hostname || device.name || device.alias || "Bilinmeyen Cihaz",
            os: device.os || "Windows",
            user: device.username || device.alias || "-",
            status: device.online || device.status === "online" ? "online" : "offline",
            lastSeen: device.updated_at || "Şimdi",
            ip: device.ip || "-",
            group: device.group || "Genel"
          }));
          return NextResponse.json(devices);
        }
      }
    } catch (error: any) {
      console.error(`${endpoint} hatası:`, error.message);
    }
  }

  // Eğer hiçbir şey bulunamazsa veya hata alınırsa boş liste dön
  return NextResponse.json([]);
}
