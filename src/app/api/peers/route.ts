import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function GET() {
  try {
    // 1. Veritabanından cihazları çek (Mevcut scripti kullan)
    const dbPath = "/var/lib/rustdesk-server/db.sqlite3"; // Ubuntu yolu
    const scriptPath = path.join(process.cwd(), "scripts", "read_db.py");
    
    let devices = [];
    try {
      const output = execSync(`python3 ${scriptPath} ${dbPath}`).toString();
      devices = JSON.parse(output);
    } catch (e) {
      console.error("DB okuma hatası:", e);
    }

    // 2. Ek donanım bilgilerini yükle
    let hardwareInfo: Record<string, any> = {};
    if (fs.existsSync(INFO_FILE)) {
      try { hardwareInfo = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {}
    }

    // 3. RustDesk uygulamasının (Desktop) beklediği formatta peers listesi hazırla
    const peers = devices.map((row: any) => {
      const deviceId = String(row.id);
      const extra = hardwareInfo[deviceId] || {};
      
      return {
        id: deviceId,
        username: row.username || "-",
        hostname: extra.hostname || row.hostname || "-",
        alias: extra.hostname || row.hostname || deviceId,
        platform: row.os || "Windows",
        tags: row.group ? [row.group] : ["Genel"],
        force_always_relay: false
      };
    });

    // RustDesk bu formatı bekler
    return NextResponse.json({
      total: peers.length,
      peers: peers
    });

  } catch (error) {
    console.error("Peers API Hatası:", error);
    return NextResponse.json({ total: 0, peers: [] });
  }
}
