import { NextResponse } from "next/server";

export async function GET() {
  const HOST = "http://192.168.0.184:3000";
  const ENDPOINTS = ["/api/devices", "/api/ab", "/api/v1/devices"]; 
  const KEY = "5XE+DKQ46fl1EgSLWqKV9qkV+nGT4VLBrhJKYUrFbD0=";

  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`[RUSTDESK DEBUG] İstek atılıyor: ${HOST}${endpoint}`);
      
      const response = await fetch(`${HOST}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEY}`
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[RUSTDESK DEBUG] ${endpoint} Hatası: ${response.status} - ${errorText}`);
        continue; // Diğer endpointi dene
      }

      const data = await response.json();
      console.log(`[RUSTDESK DEBUG] ${endpoint} Başarılı! Veri geldi.`);
      
      const rawDevices = Array.isArray(data) ? data : (data.data || data.list || []);
      
      if (rawDevices.length > 0) {
        const devices = rawDevices.map((device: any) => ({
          id: device.id || device.guid || device.id_str || "-",
          name: device.hostname || device.name || device.alias || "Cihaz",
          os: device.os || "Windows",
          user: device.username || device.alias || "-",
          status: device.online || device.status === "online" ? "online" : "offline",
          lastSeen: device.updated_at || "Şimdi",
          ip: device.ip || "-",
          group: device.group || "Genel"
        }));
        return NextResponse.json(devices);
      }
    } catch (error: any) {
      console.error(`[RUSTDESK DEBUG] ${endpoint} Bağlantı Hatası:`, error.message);
    }
  }

  // Hiçbir yerden veri gelmezse en azından terminale bilgi verelim
  console.warn("[RUSTDESK DEBUG] Hiçbir endpoint'ten cihaz listesi çekilemedi.");
  return NextResponse.json([]);
}
