import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function GET() {
  try {
    const dbPath = "/var/lib/rustdesk-server/db.sqlite3";
    const scriptPath = path.join(process.cwd(), "scripts", "read_db.py");
    
    let devices = [];
    try {
      const output = execSync(`python3 ${scriptPath} ${dbPath}`).toString();
      devices = JSON.parse(output);
    } catch (e) {}

    let hardwareInfo: Record<string, any> = {};
    if (fs.existsSync(INFO_FILE)) {
      try { hardwareInfo = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {}
    }

    const deviceList = Array.isArray(devices.data) ? devices.data : [];

    const peers = deviceList.map((row: any) => ({
      id: String(row.id),
      username: row.username || "-",
      hostname: row.hostname || "-",
      alias: row.hostname || String(row.id),
      platform: row.os || "Windows",
      tags: row.group ? [row.group] : ["Genel"]
    }));

    // RustDesk Pro/Managed formatında data dönelim
    return NextResponse.json({
      total: peers.length,
      data: peers
    });
  } catch (error) {
    return NextResponse.json({ total: 0, data: [] });
  }
}
