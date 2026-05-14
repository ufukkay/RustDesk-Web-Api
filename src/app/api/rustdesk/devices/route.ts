import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { getAuthUser, isAdmin } from "@/lib/auth";
import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";

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
    if (!await getAuthUser()) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }
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

    const onlineStatus = safeReadJson<Record<string, number>>(STATUS_FILE, {});
    const hardwareInfo = safeReadJson<Record<string, any>>(INFO_FILE, {});
    const deletedDevices = safeReadJson<string[]>(DELETED_FILE, []);

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
          isDuplicate: extra.isDuplicate || false,
          osName: extra.osName || "-",
          osBuild: extra.osBuild || "-",
          processor: extra.processor || "-",
          serialNumber: extra.serialNumber || "-",
          manufacturer: extra.manufacturer || "-",
          model: extra.model || "-",
          bootTime: extra.bootTime || "-",
          adDomain: extra.adDomain || "-",
          formFactor: extra.formFactor || "-",
          agentVersion: extra.agentVersion || "-"
        };
      })
      .filter(Boolean) as any[];

    // --- AGGRESSIVE MERGING ---
    const mergedMap = new Map<string, any>();

    rawDevices.forEach(dev => {
      const isNumeric = /^\d+$/.test(dev.id);
      
      // Eşleştirme için anahtarlar:
      // 1. Hostname (Büyük harf)
      // 2. Eğer ID rakamsal değilse, ID'nin kendisi bir hostname olabilir
      const keys = [dev.hostname];
      if (!isNumeric) keys.push(dev.id.toUpperCase());

      let existing = null;
      let matchedKey = "";

      for (const k of keys) {
        if (mergedMap.has(k)) {
          existing = mergedMap.get(k);
          matchedKey = k;
          break;
        }
      }

      if (!existing) {
        // Yeni kayıt: Tüm anahtarlarıyla ekleyelim
        keys.forEach(k => mergedMap.set(k, dev));
      } else {
        // Birleştirme Mantığı:
        const isExistingNumeric = /^\d+$/.test(existing.id);

        let primary = existing;
        let secondary = dev;

        // Rakam olan her zaman kazanır
        if (isNumeric && !isExistingNumeric) {
          primary = dev;
          secondary = existing;
        }

        const merged = {
          ...secondary,
          ...primary,
          // Online durumu her zaman kazanır
          status: (primary.status === "online" || secondary.status === "online") ? "online" : "offline",
          // Donanım verilerini birleştir (primary'de yoksa veya "-" ise secondary'den al)
          cpu: (primary.cpu && primary.cpu !== "-") ? primary.cpu : secondary.cpu,
          ram: (primary.ram && primary.ram !== "-") ? primary.ram : secondary.ram,
          disk: (primary.disk && primary.disk !== "-") ? primary.disk : secondary.disk,
          ip: (primary.ip && primary.ip !== "-") ? primary.ip : secondary.ip,
          osName: (primary.osName && primary.osName !== "-") ? primary.osName : secondary.osName,
          osBuild: (primary.osBuild && primary.osBuild !== "-") ? primary.osBuild : secondary.osBuild,
          processor: (primary.processor && primary.processor !== "-") ? primary.processor : secondary.processor,
          serialNumber: (primary.serialNumber && primary.serialNumber !== "-") ? primary.serialNumber : secondary.serialNumber,
          manufacturer: (primary.manufacturer && primary.manufacturer !== "-") ? primary.manufacturer : secondary.manufacturer,
          model: (primary.model && primary.model !== "-") ? primary.model : secondary.model,
          bootTime: (primary.bootTime && primary.bootTime !== "-") ? primary.bootTime : secondary.bootTime,
          adDomain: (primary.adDomain && primary.adDomain !== "-") ? primary.adDomain : secondary.adDomain,
          formFactor: (primary.formFactor && primary.formFactor !== "-") ? primary.formFactor : secondary.formFactor,
          agentVersion: (primary.agentVersion && primary.agentVersion !== "-") ? primary.agentVersion : secondary.agentVersion,
          net_details: (primary.net_details && primary.net_details.length > 0) ? primary.net_details : secondary.net_details,
          lastSeen: primary.lastSeenTimestamp > secondary.lastSeenTimestamp ? primary.lastSeen : secondary.lastSeen,
          lastSeenTimestamp: Math.max(primary.lastSeenTimestamp, secondary.lastSeenTimestamp)
        };

        // Tüm anahtarları güncelleyelim
        const allKeys = new Set([...keys, existing.hostname.toUpperCase()]);
        if (!isExistingNumeric) allKeys.add(existing.id.toUpperCase());
        
        allKeys.forEach(k => mergedMap.set(k, merged));
      }
    });

    const devices = Array.from(new Set(mergedMap.values()));

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
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

    const deletedDevices = safeReadJson<string[]>(DELETED_FILE, []);
    if (!deletedDevices.includes(id)) {
      safeWriteJson(DELETED_FILE, [...deletedDevices, id]);
    }

    const hardwareInfo = safeReadJson<Record<string, any>>(INFO_FILE, {});
    const deviceHostname = hardwareInfo[id]?.hostname || hardwareInfo[id]?.computer_name;

    for (const file of [STATUS_FILE, INFO_FILE]) {
      const data = safeReadJson<Record<string, unknown>>(file, {});
      let changed = false;
      if (data[id]) { delete data[id]; changed = true; }
      if (deviceHostname) {
        const h = String(deviceHostname).toUpperCase();
        if (data[h]) { delete data[h]; changed = true; }
      }
      if (changed) safeWriteJson(file, data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DEVICES DELETE] Hata:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
