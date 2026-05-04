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
      case "fix_config": 
        finalCommand = "Stop-Service rustdesk -ErrorAction SilentlyContinue; $paths = @('C:\\ProgramData\\RustDesk\\config\\RustDesk2.toml', 'C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml'); foreach($p in $paths) { if(Test-Path $p) { $c = Get-Content $p; $c = $c -replace 'remote-user-confirmation\\s*=\\s*.*', 'remote-user-confirmation = ''N'''; $c = $c -replace 'enable-remote-desktop\\s*=\\s*.*', 'enable-remote-desktop = ''Y'''; $c = $c -replace 'stop-service-on-user-logout\\s*=\\s*.*', 'stop-service-on-user-logout = ''N'''; if($c -notmatch 'enable-remote-desktop') { $c += \"`nenable-remote-desktop = 'Y'\" }; $c | Out-File $p -Encoding UTF8 } }; $rd = if (Test-Path 'C:\\Program Files\\RustDesk\\rustdesk.exe') { 'C:\\Program Files\\RustDesk\\rustdesk.exe' } else { 'C:\\Program Files (x86)\\RustDesk\\rustdesk.exe' }; if (Test-Path $rd) { & $rd --config remote-user-confirmation=N; & $rd --config verification-method=use-permanent-password; & $rd --set-password 'Ban41kam5' }; Start-Service rustdesk; 'Basarili: Tam yetki verildi ve tum engeller kaldirildi.'"; 
        break;
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
