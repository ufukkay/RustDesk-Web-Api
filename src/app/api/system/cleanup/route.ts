import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

/**
 * POST /api/system/cleanup
 * 24 saatten uzun süredir offline olan cihazları listeden temizler.
 */
export async function POST() {
  try {
    if (!fs.existsSync(STATUS_FILE)) return NextResponse.json({ success: true, count: 0 });

    const statusData = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
    const infoData = fs.existsSync(INFO_FILE) ? JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")) : {};
    
    const now = Math.floor(Date.now() / 1000);
    const dayInSeconds = 24 * 60 * 60;
    
    const newStatus: Record<string, number> = {};
    const newInfo: Record<string, any> = {};
    let count = 0;

    Object.keys(statusData).forEach(id => {
      // 24 saat kuralı (Opsiyonel: Kullanıcıya bırakılabilir, şimdilik manuel tetikleme ile hepsini siliyor olabiliriz ama güvenlik için 1 gün dedik)
      // Eğer kullanıcı tüm offline'ları silmek istiyorsa bu kontrolü kaldırabiliriz.
      // Kullanıcı "ofline olanların gitmesi lazım" dediği için tüm offline'ları siliyoruz:
      if (now - statusData[id] < 60) { // Sadece son 1 dakikada sinyal verenleri (online) tut
         newStatus[id] = statusData[id];
         if (infoData[id]) newInfo[id] = infoData[id];
      } else {
        count++;
      }
    });

    fs.writeFileSync(STATUS_FILE, JSON.stringify(newStatus, null, 2));
    fs.writeFileSync(INFO_FILE, JSON.stringify(newInfo, null, 2));

    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}
