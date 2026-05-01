import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const DB_PATH = "/home/rd/rustdesk/db_v2.sqlite3";

export async function GET() {
  try {
    // Python3 ile SQLite oku (her Linux'ta built-in gelir, build gerektirmez)
    const pythonScript = `
import sqlite3, json, sys

try:
    conn = sqlite3.connect('${DB_PATH}')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Hangi tablolar var?
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in c.fetchall()]
    
    # peer tablosu varsa oku
    if 'peer' in tables:
        c.execute("SELECT * FROM peer LIMIT 100")
        rows = [dict(r) for r in c.fetchall()]
        print(json.dumps({'ok': True, 'tables': tables, 'data': rows}))
    else:
        print(json.dumps({'ok': False, 'tables': tables, 'data': []}))
    
    conn.close()
except Exception as e:
    print(json.dumps({'ok': False, 'error': str(e), 'tables': [], 'data': []}))
`.trim();

    const { stdout, stderr } = await execAsync(`python3 -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`);
    
    if (stderr) console.error("[SQLITE PY ERROR]:", stderr);
    
    const result = JSON.parse(stdout.trim());
    console.log("[SQLITE TABLES]:", result.tables);
    console.log("[SQLITE ROWS]:", result.data?.length, "cihaz bulundu");

    if (!result.ok || !result.data?.length) {
      return NextResponse.json([]);
    }

    // Kolonları dinamik olarak oku (hangi kolonlar varsa onları kullan)
    const devices = result.data.map((row: any) => ({
      id: row.id || row.peer_id || "-",
      name: row.hostname || row.name || row.alias || row.note || row.id || "Cihaz",
      ip: row.ip || row.last_ip || "-",
      os: row.os || row.platform || "Windows",
      user: row.username || row.user || row.alias || "-",
      status: (row.status === 1 || row.online === 1 || row.status === "online") ? "online" : "offline",
      lastSeen: row.last_online
        ? new Date(Number(row.last_online) * 1000).toLocaleString("tr-TR")
        : row.created_at || "Bilinmiyor",
      group: row.group || row.note || "Genel",
    }));

    return NextResponse.json(devices);

  } catch (error: any) {
    console.error("[SQLITE FATAL]:", error.message);
    return NextResponse.json([]);
  }
}
