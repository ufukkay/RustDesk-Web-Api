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
    const body = await req.json();
    const deviceId = body.deviceId || body.id;
    const output = body.output || body.result;
    
    if (!deviceId) return NextResponse.json({ ok: false });

    // Hostname bilgisini bul
    const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");
    let key = String(deviceId);
    if (fs.existsSync(INFO_FILE)) {
      try {
        const info = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8"));
        if (info[deviceId] && info[deviceId].hostname) {
          key = info[deviceId].hostname.toUpperCase();
        }
      } catch (e) {}
    }

    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }

    const resultFile = path.join(RESULTS_DIR, `${key}.txt`);
    fs.writeFileSync(resultFile, output || "Boş çıktı", "utf-8");

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

    // Hostname bilgisini bul
    const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");
    let key = String(deviceId);
    if (fs.existsSync(INFO_FILE)) {
      try {
        const info = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8"));
        if (info[deviceId] && info[deviceId].hostname) {
          key = info[deviceId].hostname.toUpperCase();
        }
      } catch (e) {}
    }

    const resultFile = path.join(RESULTS_DIR, `${key}.txt`);
    if (fs.existsSync(resultFile)) {
      const output = fs.readFileSync(resultFile, "utf-8");
      fs.unlinkSync(resultFile);
      
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
