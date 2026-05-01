import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Sinyal gönderen cihazları geçici bir dosyada tutalım (Basit ve hızlı çözüm)
const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const deviceId = body.id || body.uuid;

    if (deviceId) {
      let statusData: Record<string, number> = {};
      
      if (fs.existsSync(STATUS_FILE)) {
        try {
          statusData = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
        } catch (e) { statusData = {}; }
      }

      // Bu cihazın son görülme zamanını kaydet (Timestamp)
      statusData[String(deviceId)] = Math.floor(Date.now() / 1000);
      
      // Dosyaya yaz
      fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
      
      console.log(`[HEARTBEAT] Cihaz aktif: ${deviceId}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: true }); // Hata olsa bile RustDesk'e 200 dönelim ki üzülmesin
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
