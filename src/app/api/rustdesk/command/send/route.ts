import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import path from "path";

const QUEUE_FILE = path.join(process.cwd(), "scripts", "command_queue.json");

export async function POST(req: Request) {
  try {
    if (!await getAuthUser()) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const { id, command } = await req.json();
    if (!id || !command) return NextResponse.json({ ok: false, error: "ID ve komut gerekli" });

    const queue = safeReadJson<Record<string, string[]>>(QUEUE_FILE, {});
    if (!queue[id]) queue[id] = [];
    queue[id].push(command);

    safeWriteJson(QUEUE_FILE, queue);

    return NextResponse.json({ ok: true, message: "Komut kuyruğa eklendi" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) });
  }
}

export async function GET(req: Request) {
  if (!await getAuthUser()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false });

  // Güvenli dosya adı — yalnızca alfanümerik ve tire/alt çizgi
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const resultFile = path.join(process.cwd(), "scripts", "command_results", `${safeId}.txt`);

  try {
    const { existsSync, readFileSync } = await import("fs");
    if (existsSync(resultFile)) {
      const content = readFileSync(resultFile, "utf-8");
      return NextResponse.json({ ok: true, result: content });
    }
  } catch {
    // dosya yok
  }

  return NextResponse.json({ ok: false, message: "Sonuç henüz gelmedi" });
}
