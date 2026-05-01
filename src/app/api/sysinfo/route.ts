import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const deviceId = body.id || body.uuid;

    if (deviceId) {
      console.log(`[SYSINFO FULL DATA] ${deviceId}:`, JSON.stringify(body));

      let infoData: Record<string, any> = {};
      if (fs.existsSync(INFO_FILE)) {
        try { infoData = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {}
      }

      // RustDesk'in gönderebileceği tüm ağ anahtarlarını kontrol edelim
      const netInfo = body.net || body.networks || body.network_interfaces || body.interfaces || body.adapters || [];

      infoData[String(deviceId)] = {
        ...body,
        standard_user: body.user || body.username || body.alias || body.login_name || "-",
        ram: body.memory || body.ram || "-",
        // Eğer ağ bilgisi direkt gelmediyse, body içindeki dizileri tara (ipconfig benzeri veri arıyoruz)
        net_details: Array.isArray(netInfo) ? netInfo : [],
        lastUpdate: Math.floor(Date.now() / 1000)
      };
      
      fs.writeFileSync(INFO_FILE, JSON.stringify(infoData, null, 2));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: true });
  }
}
