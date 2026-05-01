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
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`);

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

    const devices = result.data.map((row: any) => {
      const deviceId = String(row.id);
      const lastHeartbeat = onlineStatus[deviceId] || 0;
      const extra = hardwareInfo[deviceId] || {};
      
      const isOnline = (now - lastHeartbeat) < 90;

      return {
        id: deviceId,
        name: row.hostname || row.id,
        ip: extra.ip || row.ip || "-",
        os: extra.os || row.os || "Windows",
        // Önce 'standard_user', yoksa SQLite'taki 'user' kolonuna bak
        user: extra.standard_user || row.user || row.username || "-",
        status: isOnline ? "online" : "offline",
        lastSeen: lastHeartbeat > 0 
          ? new Date(lastHeartbeat * 1000).toLocaleString("tr-TR") 
          : "Bilinmiyor",
        group: row.note || "Genel",
        cpu: extra.cpu || "-",
        ram: extra.ram || "-",
        disk: extra.disk || "-",
        version: extra.version || "-"
      };
    });

    return NextResponse.json(devices);
  } catch (error: any) {
    return NextResponse.json([]);
  }
}
