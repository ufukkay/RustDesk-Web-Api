import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Projenin kök dizinindeki scripts/read_db.py dosyasını çalıştır
    const scriptPath = path.join(process.cwd(), "scripts", "read_db.py");
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`);

    if (stderr) console.error("[SQLITE PY STDERR]:", stderr);

    const result = JSON.parse(stdout.trim());
    console.log("[SQLITE TABLES]:", result.tables);
    
    if (!result.ok || !result.data?.length) {
      console.warn("[SQLITE] Veri gelmedi. Tablolar:", result.tables, "Hata:", result.error);
      return NextResponse.json([]);
    }

    console.log(`[SQLITE] ${result.data.length} cihaz bulundu.`);

    const devices = result.data.map((row: any) => ({
      id: String(row.id || row.peer_id || "-"),
      name: row.hostname || row.name || row.alias || row.note || String(row.id) || "Cihaz",
      ip: row.ip || row.last_ip || "-",
      os: row.os || row.platform || "Windows",
      user: row.username || row.user || row.alias || "-",
      status: (row.status === 1 || row.online === 1 || row.status === "online") ? "online" : "offline",
      lastSeen: row.last_online
        ? new Date(Number(row.last_online) * 1000).toLocaleString("tr-TR")
        : (row.created_at || "Bilinmiyor"),
      group: row.group_name || row.group || row.note || "Genel",
    }));

    return NextResponse.json(devices);

  } catch (error: any) {
    console.error("[SQLITE FATAL]:", error.message);
    return NextResponse.json([]);
  }
}
