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
      let infoData: Record<string, any> = {};
      
      if (fs.existsSync(STATUS_FILE)) {
        try { statusData = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8")); } catch (e) {}
      }
      if (fs.existsSync(INFO_FILE)) {
        try { infoData = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {}
      }

      // Kalp atışını kaydet
      statusData[String(deviceId)] = Math.floor(Date.now() / 1000);
      
      // Ekstra bilgileri (disk, ip, hostname vb.) kaydet
      if (!infoData[String(deviceId)]) infoData[String(deviceId)] = {};
      
      if (body.disk) infoData[String(deviceId)].disk = body.disk;
      if (body.ip) infoData[String(deviceId)].ip = body.ip;
      if (body.hostname) infoData[String(deviceId)].hostname = body.hostname;
      if (body.cpu) infoData[String(deviceId)].cpu = body.cpu;
      if (body.ram) infoData[String(deviceId)].ram = body.ram;
      if (body.os) infoData[String(deviceId)].os = body.os;

      // Dosyalara yaz
      fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
      fs.writeFileSync(INFO_FILE, JSON.stringify(infoData, null, 2));
      
      console.log(`[HEARTBEAT] Cihaz aktif ve güncellendi: ${deviceId}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: true }); // Hata olsa bile RustDesk'e 200 dönelim ki üzülmesin
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
