import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function GET() {
  try {
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

    const deviceList = Array.isArray(result.data) ? result.data : [];

    const devices = deviceList.map((row: any) => {
      const deviceId = String(row.id);
      const lastHeartbeat = onlineStatus[deviceId] || 0;
      const extra = hardwareInfo[deviceId] || {};
      
      let sqliteInfo: any = {};
      try { if (row.info) sqliteInfo = JSON.parse(row.info); } catch (e) {}

      const isOnline = (now - lastHeartbeat) < 90;

      // Yerel ağ bilgilerini işle
      let localNets: any[] = [];
      if (extra.local_network_raw) {
        const ips = typeof extra.local_network_raw === 'string' 
          ? extra.local_network_raw.split(',') 
          : extra.local_network_raw;
          
        localNets = Array.isArray(ips) ? ips.map((ip: string, i: number) => ({
          name: `Ağ Kartı ${i + 1}`,
          ipv4: ip.trim(),
          mac: "-",
          mask: "-"
        })) : [];
      }

      return {
        id: deviceId,
        name: extra.hostname || extra.computer_name || row.hostname || sqliteInfo.hostname || row.username || row.id,
        ip: extra.ip || sqliteInfo.ip || row.ip || "-",
        os: extra.os || row.os || "Windows",
        user: extra.standard_user || row.user || row.username || "-",
        status: isOnline ? "online" : "offline",
        lastSeen: lastHeartbeat > 0 
          ? new Date(lastHeartbeat * 1000).toLocaleString("tr-TR") 
          : "Bilinmiyor",
        group: row.note || "Genel",
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
    return NextResponse.json([]);
  }
}
