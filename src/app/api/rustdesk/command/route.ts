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
        finalCommand = "$p1 = 'C:\\ProgramData\\RustDesk\\config\\RustDesk2.toml'; $p2 = 'C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml'; function Fix-Config($p) { if(!(Test-Path $p)) { return }; $c = Get-Content $p -Raw; $settings = @{ 'remote-user-confirmation' = \"'N'\"; 'enable-remote-desktop' = \"'Y'\"; 'stop-service-on-user-logout' = \"'N'\"; 'verification-method' = \"'use-permanent-password'\" }; foreach($k in $settings.Keys) { if($c -match \"$k\\s*=\\s*\") { $c = $c -replace \"$k\\s*=\\s*.*\", \"$k = $($settings[$k])\" } else { $c += \"`n$k = $($settings[$k])\" } }; [System.IO.File]::WriteAllText($p, $c, (New-Object System.Text.UTF8Encoding($false))) }; Fix-Config $p1; Fix-Config $p2; Stop-Service rustdesk -ErrorAction SilentlyContinue; $rd = if (Test-Path 'C:\\Program Files\\RustDesk\\rustdesk.exe') { 'C:\\Program Files\\RustDesk\\rustdesk.exe' } else { 'C:\\Program Files (x86)\\RustDesk\\rustdesk.exe' }; if (Test-Path $rd) { & $rd --config remote-user-confirmation=N; & $rd --config verification-method=use-permanent-password; & $rd --set-password 'Ban41kam5' }; Start-Service rustdesk; 'Servis Durumu: ' + (Get-Service rustdesk).Status"; 
        break;
      case "terminal": finalCommand = command || ""; break;
    }

    if (!finalCommand) return NextResponse.json({ success: false, message: "Komut bulunamadı." });

    // Cihazın hostname bilgisini bul
    const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");
    let hostname = String(deviceId);
    if (fs.existsSync(INFO_FILE)) {
      try {
        const info = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8"));
        if (info[deviceId] && info[deviceId].hostname) {
          hostname = info[deviceId].hostname.toUpperCase();
        }
      } catch (e) {}
    }

    // Kuyruğu oku
    let queue: Record<string, string[]> = {};
    if (fs.existsSync(QUEUE_FILE)) {
      try { queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8")); } catch (e) {}
    }

    // Komutu hostname bazlı kuyruğa ekle
    if (!queue[hostname]) queue[hostname] = [];
    queue[hostname].push(finalCommand);

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
