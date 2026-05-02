import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");
const QUEUE_FILE = path.join(process.cwd(), "scripts", "command_queue.json");

export async function POST(req: Request) {
  try {
    let body;
    try { body = await req.json(); } catch (e) { return NextResponse.json({ ok: true }); }

    const deviceId = body.id || body.uuid;
    if (!deviceId) return NextResponse.json({ ok: true });

    const deviceIdStr = String(deviceId);
    const now = Math.floor(Date.now() / 1000);

    // 1. Durum ve Bilgi Güncelle
    let statusData: Record<string, number> = {};
    let infoData: Record<string, any> = {};
    if (fs.existsSync(STATUS_FILE)) { try { statusData = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8")); } catch (e) {} }
    if (fs.existsSync(INFO_FILE)) { try { infoData = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {} }

    statusData[deviceIdStr] = now;
    if (!infoData[deviceIdStr]) infoData[deviceIdStr] = {};
    if (body.disk) infoData[deviceIdStr].disk = body.disk;
    if (body.ip) infoData[deviceIdStr].ip = body.ip;
    if (body.network) infoData[deviceIdStr].network = body.network; // Detaylı ağ verisi
    if (body.hostname) infoData[deviceIdStr].hostname = body.hostname;
    if (body.cpu) infoData[deviceIdStr].cpu = body.cpu;
    if (body.ram) infoData[deviceIdStr].ram = body.ram;
    if (body.os) infoData[deviceIdStr].os = body.os;

    fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
    fs.writeFileSync(INFO_FILE, JSON.stringify(infoData, null, 2));

    // 2. Bekleyen Komut Var mı Kontrol Et
    let pendingCommand = null;
    if (fs.existsSync(QUEUE_FILE)) {
      try {
        let queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
        if (queue[deviceIdStr] && queue[deviceIdStr].length > 0) {
          pendingCommand = queue[deviceIdStr].shift(); // İlk komutu al
          fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
          console.log(`[HEARTBEAT] Command sent to ${deviceIdStr}: ${pendingCommand}`);
        }
      } catch (e) {}
    }

    return NextResponse.json({ 
      ok: true, 
      command: pendingCommand // Varsa komutu gönder
    });

  } catch (error) {
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
