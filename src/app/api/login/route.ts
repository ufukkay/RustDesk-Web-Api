import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, id, uuid } = body;
    const deviceId = id || uuid;

    // 1. Cihaz Bilgilerini Güncelle (Mevcut mantık)
    if (deviceId) {
      let infoData: Record<string, any> = {};
      if (fs.existsSync(INFO_FILE)) {
        try { infoData = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {}
      }
      const currentInfo = infoData[String(deviceId)] || {};
      const localIps = body.local_ips || body.info?.local_ips || "";
      
      infoData[String(deviceId)] = {
        ...currentInfo,
        ...body,
        local_network_raw: localIps,
        lastLoginUpdate: Math.floor(Date.now() / 1000)
      };
      fs.writeFileSync(INFO_FILE, JSON.stringify(infoData, null, 2));
    }

    // 2. RustDesk Uygulaması (Desktop) için Login Kontrolü
    if (username) {
      const TECH_FILE = path.join(process.cwd(), "scripts", "technicians.json");
      let technicians = [];
      
      if (fs.existsSync(TECH_FILE)) {
        try { technicians = JSON.parse(fs.readFileSync(TECH_FILE, "utf-8")); } catch (e) {}
      }

      // Kullanıcı adı ve şifre kontrolü
      const user = technicians.find((t: any) => 
        (t.username === username || t.email === username) && t.password === password
      );

      if (!user) {

        return NextResponse.json({ error: "Invalid username or password" }, { status: 400 });
      }


      return NextResponse.json({ 
        access_token: "token-" + Math.random().toString(36).substring(7),
        type: "access_token",
        user: { 
          name: user.name,
          email: user.email 
        }
      });
    }

    // 3. Varsayılan Başarılı Cevap (Cihaz kayıtları için)
    return NextResponse.json({ code: 200, message: "OK" });

  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 400 });
  }
}
