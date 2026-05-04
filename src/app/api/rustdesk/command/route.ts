import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const QUEUE_FILE = path.join(process.cwd(), "scripts", "command_queue.json");

export async function POST(req: Request) {
  try {
    const { deviceId, action, command } = await req.json();
    if (!deviceId) return NextResponse.json({ success: false, message: "Cihaz ID gerekli." });

    let finalCommand = "";
    switch (action) {
      case "restart": finalCommand = "shutdown /r /t 0 /f"; break;
      case "shutdown": finalCommand = "shutdown /s /t 0 /f"; break;
      case "lock": finalCommand = "rundll32.exe user32.dll,LockWorkStation"; break; 
      case "refresh": finalCommand = "refresh_info"; break;
      case "terminal": finalCommand = command || ""; break;
    }

    if (!finalCommand) return NextResponse.json({ success: false, message: "Komut bulunamadı." });

    // Kuyruğu oku
    let queue: Record<string, string[]> = {};
    if (fs.existsSync(QUEUE_FILE)) {
      try { queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8")); } catch (e) {}
    }

    // Komutu cihaza özel kuyruğa ekle
    if (!queue[String(deviceId)]) queue[String(deviceId)] = [];
    queue[String(deviceId)].push(finalCommand);

    // Kuyruğu kaydet
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

    // console.log(`[COMMAND QUEUED] Device: ${deviceId}, Command: ${finalCommand}`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Komut kuyruğa alındı. Cihazın bir sonraki kalp atışında (max 10sn) çalıştırılacak.",
      output: "Kuyruğa Alındı..."
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Sunucu hatası." });
  }
}
