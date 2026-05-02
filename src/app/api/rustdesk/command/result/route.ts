import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RESULTS_FILE = path.join(process.cwd(), "scripts", "command_results.json");

export async function POST(req: Request) {
  try {
    const { deviceId, output, isBase64 } = await req.json();
    if (!deviceId) return NextResponse.json({ ok: false });

    let finalOutput = output;
    if (isBase64 && output) {
      try {
        finalOutput = Buffer.from(output, 'base64').toString('utf-8');
      } catch (e) {
        console.error("Base64 decode error:", e);
      }
    }

    let results: Record<string, any> = {};
    if (fs.existsSync(RESULTS_FILE)) {
      try { results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8")); } catch (e) {}
    }

    results[String(deviceId)] = {
      output: finalOutput || "Komut calistirildi ama cikti bos.",
      timestamp: Date.now()
    };
    
    console.log(`[RESULT] Device ${deviceId} sent ${finalOutput?.length || 0} chars`);
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
      
      if (data) {
        // Eğer data bir objeyse output'u al, değilse direkt kendisini al (Geriye dönük uyumluluk)
        const output = typeof data === 'object' ? data.output : data;
        const timestamp = typeof data === 'object' ? data.timestamp : Date.now();

        // Sadece son 2 dakika içindeki sonuçları göster (Karışıklığı önler)
        if (Date.now() - timestamp < 120000) {
          return NextResponse.json({ output: output });
        }
      }
    } catch (e) {}
  }
  return NextResponse.json({ output: "" });
}
