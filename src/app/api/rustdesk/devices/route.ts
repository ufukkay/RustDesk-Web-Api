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
const DELETED_FILE = path.join(process.cwd(), "scripts", "deleted_devices.json");

let cachedDevices: any[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 5000; // 5 saniye

/**
 * GET /api/rustdesk/devices
 */
export async function GET() {
  try {
    const now_ms = Date.now();
    if (now_ms - lastFetchTime < CACHE_TTL && cachedDevices.length > 0) {
      return NextResponse.json(cachedDevices);
    }

    const scriptPath = path.join(process.cwd(), "scripts", "read_db.py");
    
    // Python komutunu belirle (python3 veya python)
    let stdout = "";
    try {
      const res = await execAsync(`python3 "${scriptPath}"`);
      stdout = res.stdout;
    } catch (e) {
      try {
        const res = await execAsync(`python "${scriptPath}"`);
        stdout = res.stdout;
      } catch (e2) {
        console.error("[DEVICES API] Python bulunamadı veya script hatası");
        return NextResponse.json([]);
      }
    }

    if (!stdout) return NextResponse.json([]);
    const result = JSON.parse(stdout.trim());
    if (!result.ok) return NextResponse.json([]);

    let onlineStatus: Record<string, number> = {};
    let hardwareInfo: Record<string, any> = {};
    let deletedDevices: string[] = [];

    if (fs.existsSync(STATUS_FILE)) {
      try { onlineStatus = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8")); } catch (e) {}
    }
    if (fs.existsSync(INFO_FILE)) {
      try { hardwareInfo = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {}
    }
    if (fs.existsSync(DELETED_FILE)) {
      try { deletedDevices = JSON.parse(fs.readFileSync(DELETED_FILE, "utf-8")); } catch (e) {}
    }

    const now = Math.floor(now_ms / 1000);
    const sqliteDevices = Array.isArray(result.data) ? result.data : [];
    
    // Tüm cihaz ID'lerini topla (SQLite + Agent)
    const allIds = new Set([
      ...sqliteDevices.map((d: any) => String(d.id)),
      ...Object.keys(onlineStatus)
    ]);

    const rawDevices = Array.from(allIds)
      .map(id => {
        const sqliteRow = sqliteDevices.find((d: any) => String(d.id) === id) || {};
        const lastHeartbeat = onlineStatus[id] || 0;
        const extra = hardwareInfo[id] || {};
        
        let sqliteInfo: any = {};
        try { if (sqliteRow.info) sqliteInfo = JSON.parse(sqliteRow.info); } catch (e) {}

        const isOnline = (now - lastHeartbeat) < 90;

        // Kullanıcı isteği: Sadece silinmemiş cihazları veya SİLİNMİŞ AMA ONLINE olanları getir.
        // Yani: Silinmişse VE offline ise getirme.
        const isDeleted = deletedDevices.includes(id);
        if (isDeleted && !isOnline) {
          return null;
        }

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
          hostname: (extra.hostname || extra.computer_name || sqliteRow.hostname || sqliteInfo.hostname || sqliteRow.username || id).toUpperCase(),
          name: extra.hostname || extra.computer_name || sqliteRow.hostname || sqliteInfo.hostname || sqliteRow.username || id,
          ip: extra.ip || sqliteInfo.ip || sqliteRow.ip || "-",
          os: extra.os || sqliteRow.os || "Windows",
          user: extra.standard_user || sqliteRow.user || sqliteRow.username || "-",
          status: isOnline ? "online" : "offline",
          lastSeen: lastHeartbeat > 0 ? new Date(lastHeartbeat * 1000).toLocaleString("tr-TR") : "Bilinmiyor",
          lastSeenTimestamp: lastHeartbeat,
          group: sqliteRow.note || "Genel",
          network: extra.network || [],
          cpu: extra.cpu || "-",
          ram: extra.ram || extra.memory || "-",
          disk: extra.disk || extra.storage || "-",
          version: extra.version || "-",
          gateway: extra.gateway || "-",
          dns: extra.dns || "-",
          net_details: localNets.length > 0 ? localNets : (extra.net_details || []),
          isDuplicate: extra.isDuplicate || false
        };
      })
      .filter(Boolean) as any[];

    // --- AGGRESSIVE MERGING BY HOSTNAME ---
    const mergedMap = new Map<string, any>();

    rawDevices.forEach(dev => {
      const key = dev.hostname;
      const existing = mergedMap.get(key);

      if (!existing) {
        mergedMap.set(key, dev);
      } else {
        // Birleştirme Mantığı:
        // 1. Rakamsal ID (Gerçek RustDesk ID) olanı ana ID olarak seç
        const isNewNumeric = /^\d+$/.test(dev.id);
        const isExistingNumeric = /^\d+$/.test(existing.id);

        let primary = existing;
        let secondary = dev;

        if (isNewNumeric && !isExistingNumeric) {
          primary = dev;
          secondary = existing;
        }

        // Verileri birleştir (Boş olmayanları al)
        const merged = {
          ...secondary, // Önce ikincil verileri koy
          ...primary,   // Sonra birincil verilerle ez
          // Ama donanım verileri hangisinde doluysa onu alalım
          cpu: primary.cpu !== "-" ? primary.cpu : secondary.cpu,
          ram: primary.ram !== "-" ? primary.ram : secondary.ram,
          disk: primary.disk !== "-" ? primary.disk : secondary.disk,
          ip: primary.ip !== "-" ? primary.ip : secondary.ip,
          // Durum olarak en güncel olanı al
          status: (primary.status === "online" || secondary.status === "online") ? "online" : "offline",
          lastSeen: primary.lastSeenTimestamp > secondary.lastSeenTimestamp ? primary.lastSeen : secondary.lastSeen
        };

        mergedMap.set(key, merged);
      }
    });

    const devices = Array.from(mergedMap.values());

    cachedDevices = devices;
    lastFetchTime = now_ms;
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

    // 1. SİLİNENLER LİSTESİNE EKLE (Hafızada tutalım ki offline ise bir daha gelmesin)
    let deletedDevices: string[] = [];
    if (fs.existsSync(DELETED_FILE)) {
      try { deletedDevices = JSON.parse(fs.readFileSync(DELETED_FILE, "utf-8")); } catch (e) {}
    }
    if (!deletedDevices.includes(id)) {
      deletedDevices.push(id);
      fs.writeFileSync(DELETED_FILE, JSON.stringify(deletedDevices, null, 2));
    }

    let hardwareInfo: Record<string, any> = {};
    if (fs.existsSync(INFO_FILE)) {
      try { hardwareInfo = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {}
    }

    const deviceHostname = hardwareInfo[id]?.hostname || hardwareInfo[id]?.computer_name;

    [STATUS_FILE, INFO_FILE].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const data = JSON.parse(fs.readFileSync(file, "utf-8"));
          let changed = false;
          if (data[id]) { delete data[id]; changed = true; }
          if (deviceHostname) {
            const h = String(deviceHostname).toUpperCase();
            if (data[h]) { delete data[h]; changed = true; }
          }
          if (changed) fs.writeFileSync(file, JSON.stringify(data, null, 2));
        } catch (e) {}
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DEVICES DELETE] Hata:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
