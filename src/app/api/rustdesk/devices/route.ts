import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "read_db.py");
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`);

    // Python script'inden gelen her şeyi logla
    if (stderr) console.log("[PYTHON DEBUG]:", stderr);

    const result = JSON.parse(stdout.trim());
    
    // Eğer Python tarafında bir sorun varsa bunu UI'a gönderelim
    if (!result.ok) {
      return NextResponse.json({ 
        error: true, 
        message: result.error || "Veritabanı okunamadı",
        debug: stderr 
      }, { status: 500 });
    }

    if (!result.data || result.data.length === 0) {
      console.warn("[SQLITE] Tablo boş veya bulunamadı.");
      return NextResponse.json([]);
    }

    const devices = result.data.map((row: any) => ({
      id: String(row.id || row.peer_id || "-"),
      name: row.hostname || row.name || row.alias || row.note || String(row.id),
      ip: row.ip || row.last_ip || "-",
      os: row.os || row.platform || "Windows",
      user: row.username || row.user || row.alias || "-",
      status: (row.status === 1 || row.online === 1) ? "online" : "offline",
      lastSeen: row.last_online
        ? new Date(Number(row.last_online) * 1000).toLocaleString("tr-TR")
        : "Bilinmiyor",
      group: row.group_name || row.group || row.note || "Genel",
    }));

    return NextResponse.json(devices);

  } catch (error: any) {
    console.error("[SQLITE FATAL]:", error.message);
    return NextResponse.json({ 
      error: true, 
      message: "Sistemsel Hata: " + error.message 
    }, { status: 500 });
  }
}
