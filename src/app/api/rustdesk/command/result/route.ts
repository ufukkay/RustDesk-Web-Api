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



    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[COMMAND RESULT ERROR]", error);
    return NextResponse.json({ ok: false });
  }
}
/**
 * GET /api/rustdesk/command/result
 * Cihazın bekleyen komut çıktısını okur.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");
    if (!deviceId) return NextResponse.json({ output: null });

    const resultFile = path.join(RESULTS_DIR, `${deviceId}.txt`);
    if (fs.existsSync(resultFile)) {
      const output = fs.readFileSync(resultFile, "utf-8");
      // Okuduktan sonra dosyayı silebiliriz (FIFO mantığı)
      fs.unlinkSync(resultFile);
      
      // Base64 ise çöz
      try {
        const decoded = Buffer.from(output, "base64").toString("utf-8");
        return NextResponse.json({ output: decoded });
      } catch (e) {
        return NextResponse.json({ output });
      }
    }

    return NextResponse.json({ output: null });
  } catch (error) {
    return NextResponse.json({ output: null });
  }
}
