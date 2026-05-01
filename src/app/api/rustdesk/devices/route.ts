import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");

export async function GET() {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "read_db.py");
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`);

    if (stderr) console.log("[PYTHON DEBUG]:", stderr);

    const result = JSON.parse(stdout.trim());
    
    if (!result.ok) {
      return NextResponse.json({ error: true, message: result.error }, { status: 500 });
    }

    // Online durumlarını dosyadan oku
    let onlineStatus: Record<string, number> = {};
    if (fs.existsSync(STATUS_FILE)) {
      try {
        onlineStatus = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
      } catch (e) {}
    }

    const now = Math.floor(Date.now() / 1000);

    const devices = result.data.map((row: any) => {
      const deviceId = String(row.id);
      const lastHeartbeat = onlineStatus[deviceId] || 0;
      
      // Eğer son 90 saniye içinde sinyal gelmişse ONLINE kabul et
      const isOnline = (now - lastHeartbeat) < 90;

      return {
        id: deviceId,
        name: row.hostname || row.id,
        ip: row.ip || "-",
        os: row.os || "Windows",
        user: row.username || "-",
        status: isOnline ? "online" : "offline",
        lastSeen: lastHeartbeat > 0 
          ? new Date(lastHeartbeat * 1000).toLocaleString("tr-TR") 
          : "Bilinmiyor",
        group: row.note || "Genel",
      };
    });

    console.log(`[DEVICES] ${devices.filter((d: any) => d.status === "online").length} cihaz online.`);
    return NextResponse.json(devices);

  } catch (error: any) {
    console.error("[SQLITE FATAL]:", error.message);
    return NextResponse.json([], { status: 500 });
  }
}
