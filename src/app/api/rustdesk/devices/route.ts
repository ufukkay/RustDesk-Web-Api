import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

// RustDesk hbbs'nin SQLite veritabanı yolu
const DB_PATH = "/home/rd/rustdesk/db_v2.sqlite3";

export async function GET() {
  try {
    // Read-only modda aç (güvenli - hbbs'yi etkilemez)
    const db = new Database(DB_PATH, { readonly: true });

    // peer tablosundaki tüm cihazları çek
    // RustDesk'in peer tablosu: id, uuid, pk, created_at, user, status, note, region, strategy_id, last_online
    const rows = db.prepare(`
      SELECT 
        id,
        COALESCE(hostname, id) as hostname,
        COALESCE(ip, '-') as ip,
        COALESCE(os, 'Windows') as os,
        COALESCE(username, '-') as username,
        status,
        last_online,
        note
      FROM peer 
      ORDER BY last_online DESC
    `).all() as any[];

    db.close();

    const devices = rows.map((row: any) => ({
      id: row.id,
      name: row.hostname || row.id,
      ip: row.ip || "-",
      os: row.os || "Windows",
      user: row.username || "-",
      status: row.status === 1 ? "online" : "offline",
      lastSeen: row.last_online
        ? new Date(row.last_online * 1000).toLocaleString("tr-TR")
        : "Bilinmiyor",
      group: row.note || "Genel",
    }));

    console.log(`[SQLITE] ${devices.length} cihaz bulundu.`);
    return NextResponse.json(devices);

  } catch (error: any) {
    console.error("[SQLITE ERROR]:", error.message);
    // Eğer tablo adı farklıysa hangi tablolar var diye kontrol et
    try {
      const db = new Database(DB_PATH, { readonly: true });
      const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
      db.close();
      console.log("[SQLITE TABLES]:", tables);
    } catch (e) {}
    
    return NextResponse.json([]);
  }
}
