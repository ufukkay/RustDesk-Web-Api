import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const QUEUE_FILE = path.join(process.cwd(), "scripts", "command_queue.json");

/**
 * POST /api/rustdesk/command/send
 * Dashboard üzerinden cihaza komut gönderir (kuyruğa ekler).
 */
export async function POST(req: Request) {
  try {
    const { id, command } = await req.json();
    if (!id || !command) return NextResponse.json({ ok: false, error: "ID ve komut gerekli" });

    let queue: Record<string, string[]> = {};
    if (fs.existsSync(QUEUE_FILE)) {
      try {
        queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
      } catch (e) {}
    }

    if (!queue[id]) queue[id] = [];
    queue[id].push(command);

    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

    return NextResponse.json({ ok: true, message: "Komut kuyruğa eklendi" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) });
  }
}

/**
 * GET /api/rustdesk/command/status?id=...
 * Komut sonucunu kontrol eder.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false });

  const resultFile = path.join(process.cwd(), "scripts", "command_results", `${id}.txt`);
  
  if (fs.existsSync(resultFile)) {
    const content = fs.readFileSync(resultFile, "utf-8");
    // Sonucu okuduktan sonra dosyayı temizleyebiliriz (opsiyonel)
    // fs.unlinkSync(resultFile); 
    return NextResponse.json({ ok: true, result: content });
  }

  return NextResponse.json({ ok: false, message: "Sonuç henüz gelmedi" });
}
