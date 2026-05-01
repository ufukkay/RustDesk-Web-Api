import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const deviceId = body.id || body.uuid;

    if (deviceId) {
      let infoData: Record<string, any> = {};
      if (fs.existsSync(INFO_FILE)) {
        try { infoData = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {}
      }

      // Login anında gelen lokal IP'leri ve diğer bilgileri kaydedelim
      const currentInfo = infoData[String(deviceId)] || {};
      
      // RustDesk Login paketinde genellikle 'local_ips' veya 'info' içinde ağ detayları olur
      const localIps = body.local_ips || body.info?.local_ips || "";
      
      infoData[String(deviceId)] = {
        ...currentInfo,
        ...body,
        local_network_raw: localIps,
        lastLoginUpdate: Math.floor(Date.now() / 1000)
      };
      
      fs.writeFileSync(INFO_FILE, JSON.stringify(infoData, null, 2));
    }

    // RustDesk istemcisinin çalışmaya devam etmesi için başarılı dönmeliyiz
    return NextResponse.json({ 
      code: 200, 
      data: { 
        token: "fake-token-" + Math.random().toString(36).substring(7),
        user: { name: body.id }
      } 
    });
  } catch (error) {
    return NextResponse.json({ code: 400 });
  }
}
