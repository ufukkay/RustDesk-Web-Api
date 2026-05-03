import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RESULTS_DIR = path.join(process.cwd(), "scripts", "command_results");

/**
 * POST /api/rustdesk/command/result
 * Cihazdan gelen komut çıktısını kaydeder.
 */
export async function POST(req: Request) {
  try {
    const { id, result } = await req.json();
    if (!id) return NextResponse.json({ ok: false });

    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }

    const resultFile = path.join(RESULTS_DIR, `${id}.txt`);
    fs.writeFileSync(resultFile, result || "Boş çıktı", "utf-8");

    console.log(`[COMMAND RESULT] Cihaz: ${id}, Boyut: ${result?.length || 0} karakter`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[COMMAND RESULT ERROR]", error);
    return NextResponse.json({ ok: false });
  }
}
