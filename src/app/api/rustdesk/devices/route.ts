import { NextResponse } from "next/server";

export async function GET() {
  // Not: Buradaki IP ve Port store'dan dinamik olarak da alınabilir
  // Şimdilik senin ekran görüntündeki IP'yi baz alıyoruz.
  const API_URL = "http://192.168.0.184:3000/api/devices"; 
  
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE' // Eğer token gerekiyorsa buraya eklenecek
      },
      next: { revalidate: 10 } // 10 saniyede bir önbelleği tazele
    });

    if (!response.ok) {
      throw new Error(`Sunucu hatası: ${response.status}`);
    }

    const data = await response.json();
    
    // RustDesk API genelde listeyi direkt veya 'data' içinde döndürür.
    // Gelen veriyi bizim 'Device' formatımıza uygun hale getiriyoruz:
    const devices = (Array.isArray(data) ? data : data.data || []).map((device: any) => ({
      id: device.id || device.guid || "-",
      name: device.hostname || device.name || "Bilinmeyen Cihaz",
      os: device.os || "Windows",
      user: device.username || device.alias || "-",
      status: device.online ? "online" : "offline",
      lastSeen: device.updated_at || "Az önce",
      ip: device.ip || "-",
      group: device.group || "Genel"
    }));

    return NextResponse.json(devices);
  } catch (error: any) {
    console.error("RustDesk API Bağlantı Hatası:", error.message);
    // Hata durumunda boş liste dönüyoruz ki arayüz bozulmasın
    return NextResponse.json([]);
  }
}
