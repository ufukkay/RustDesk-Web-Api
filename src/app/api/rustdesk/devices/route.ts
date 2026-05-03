import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

/**
 * Node.js'in exec fonksiyonunu async/await ile kullanabilmek için promisify ediyoruz.
 */
const execAsync = promisify(exec);

/**
 * Verilerin saklandığı dosya yolları
 */
const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");
const BLACKLIST_FILE = path.join(process.cwd(), "scripts", "blacklist.json");

/**
 * GET /api/rustdesk/devices
 */
export async function GET() {
  try {
    // Blacklist'i oku
    let blacklist: Record<string, boolean> = {};
    if (fs.existsSync(BLACKLIST_FILE)) {
      try { blacklist = JSON.parse(fs.readFileSync(BLACKLIST_FILE, "utf-8")); } catch (e) {}
    }

    const scriptPath = path.join(process.cwd(), "scripts", "read_db.py");
    const { stdout } = await execAsync(`python3 "${scriptPath}"`);

    const result = JSON.parse(stdout.trim());
    if (!result.ok) return NextResponse.json([]);

    let onlineStatus: Record<string, number> = {};
    let hardwareInfo: Record<string, any> = {};

    if (fs.existsSync(STATUS_FILE)) {
      try { onlineStatus = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8")); } catch (e) {}
    }
    if (fs.existsSync(INFO_FILE)) {
      try { hardwareInfo = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {}
    }

    const now = Math.floor(Date.now() / 1000);
    const sqliteDevices = Array.isArray(result.data) ? result.data : [];
    
    // Tüm cihaz ID'lerini topla (SQLite + Agent)
    const allIds = new Set([
      ...sqliteDevices.map((d: any) => String(d.id)),
      ...Object.keys(onlineStatus)
    ]);

    const devices = Array.from(allIds)
      .filter(id => !blacklist[id]) // Blacklist'tekileri atla
      .map(id => {
        const sqliteRow = sqliteDevices.find((d: any) => String(d.id) === id) || {};
        const lastHeartbeat = onlineStatus[id] || 0;
        const extra = hardwareInfo[id] || {};
        
        let sqliteInfo: any = {};
        try { if (sqliteRow.info) sqliteInfo = JSON.parse(sqliteRow.info); } catch (e) {}

        const isOnline = (now - lastHeartbeat) < 90;

        let localNets: any[] = [];
        if (extra.local_network_raw) {
          const ips = typeof extra.local_network_raw === 'string' ? extra.local_network_raw.split(',') : extra.local_network_raw;
          localNets = Array.isArray(ips) ? ips.map((ip: string, i: number) => ({
            name: `Ağ Kartı ${i + 1}`,
            ipv4: ip.trim(),
            mac: "-",
            mask: "-"
          })) : [];
        }

        return {
          id: id,
          name: extra.hostname || extra.computer_name || sqliteRow.hostname || sqliteInfo.hostname || sqliteRow.username || id,
          ip: extra.ip || sqliteInfo.ip || sqliteRow.ip || "-",
          os: extra.os || sqliteRow.os || "Windows",
          user: extra.standard_user || sqliteRow.user || sqliteRow.username || "-",
          status: isOnline ? "online" : "offline",
          lastSeen: lastHeartbeat > 0 ? new Date(lastHeartbeat * 1000).toLocaleString("tr-TR") : "Bilinmiyor",
          group: sqliteRow.note || "Genel",
          network: extra.network || [],
          cpu: extra.cpu || "-",
          ram: extra.ram || extra.memory || "-",
          disk: extra.disk || extra.storage || "-",
          version: extra.version || "-",
          net_details: localNets.length > 0 ? localNets : (extra.net_details || [])
        };
      });

    return NextResponse.json(devices);
  } catch (error) {
    console.error("[DEVICES API] Hata:", error);
    return NextResponse.json([]);
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

    // 1. Blacklist'e ekle (Gelecekte de görünmesin)
    let blacklist: Record<string, boolean> = {};
    if (fs.existsSync(BLACKLIST_FILE)) {
      try { blacklist = JSON.parse(fs.readFileSync(BLACKLIST_FILE, "utf-8")); } catch (e) {}
    }
    blacklist[String(id)] = true;
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2));

    // 2. Mevcut verilerden temizle
    [STATUS_FILE, INFO_FILE].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const data = JSON.parse(fs.readFileSync(file, "utf-8"));
          if (data[id]) {
            delete data[id];
            fs.writeFileSync(file, JSON.stringify(data, null, 2));
          }
        } catch (e) {}
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
