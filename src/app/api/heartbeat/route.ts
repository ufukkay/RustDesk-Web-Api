import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      // Eğer JSON değilse veya boşsa hata almamak için
      return NextResponse.json({ ok: true });
    }

    const deviceId = body.id || body.uuid;

    if (deviceId) {
      const deviceIdStr = String(deviceId);
      let statusData: Record<string, number> = {};
      let infoData: Record<string, any> = {};
      
      // Dosyaları oku
      if (fs.existsSync(STATUS_FILE)) {
        try { statusData = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8")); } catch (e) {}
      }
      if (fs.existsSync(INFO_FILE)) {
        try { infoData = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {}
      }

      // Kalp atışını ve zamanı kaydet (Şu anki zaman)
      const now = Math.floor(Date.now() / 1000);
      statusData[deviceIdStr] = now;
      
      // Bilgileri güncelle
      if (!infoData[deviceIdStr]) infoData[deviceIdStr] = {};
      
      if (body.disk) infoData[deviceIdStr].disk = body.disk;
      if (body.ip) infoData[deviceIdStr].ip = body.ip;
      if (body.hostname) infoData[deviceIdStr].hostname = body.hostname;
      if (body.cpu) infoData[deviceIdStr].cpu = body.cpu;
      if (body.ram) infoData[deviceIdStr].ram = body.ram;
      if (body.os) infoData[deviceIdStr].os = body.os;

      // Dosyalara yaz
      try {
        fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
        fs.writeFileSync(INFO_FILE, JSON.stringify(infoData, null, 2));
        console.log(`[HEARTBEAT] OK: ${deviceIdStr} (Time: ${now})`);
      } catch (writeErr) {
        console.error("[HEARTBEAT] File Write Error:", writeErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[HEARTBEAT] Critical Error:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
