import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RESULTS_FILE = path.join(process.cwd(), "scripts", "command_results.json");

export async function POST(req: Request) {
  try {
    const { deviceId, output, isBase64 } = await req.json();
    if (!deviceId) return NextResponse.json({ ok: false });

    let finalOutput = output;
    
    // Eğer veri Base64 ise çöz (Özel karakter sorunlarını önler)
    if (isBase64) {
      finalOutput = Buffer.from(output, 'base64').toString('utf-8');
    }

    let results: Record<string, any> = {};
    if (fs.existsSync(RESULTS_FILE)) {
      try { results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8")); } catch (e) {}
    }

    // Sonucu ve zaman damgasını kaydet
    results[String(deviceId)] = {
      output: finalOutput,
      timestamp: Date.now()
    };
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ output: "" });

  if (fs.existsSync(RESULTS_FILE)) {
    try {
      const results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8"));
      const data = results[String(deviceId)];
      
      // Eğer sonuç 1 dakikadan eskiyse temiz say
      if (data && (Date.now() - data.timestamp < 60000)) {
        return NextResponse.json({ output: data.output });
      }
    } catch (e) {}
  }
  return NextResponse.json({ output: "" });
}
