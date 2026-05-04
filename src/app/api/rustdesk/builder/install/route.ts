import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getSettings();

    const host            = searchParams.get("host") || settings.host;
    const port            = searchParams.get("port") || settings.port;
    const apiPort         = settings.port || "3000";
    const defaultPassword = settings.defaultPassword || "";

    // Sunucu anahtarını dosya sisteminden oku
    const keyPaths = [
      "C:\\ProgramData\\RustDesk\\config\\id_ed25519.pub",
      "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\id_ed25519.pub",
      path.join(process.cwd(), "id_ed25519.pub")
    ];

    let serverKey = "";
    for (const p of keyPaths) {
      try {
        if (fs.existsSync(p)) {
          serverKey = fs.readFileSync(p, "utf-8").trim();
          break;
        }
      } catch { continue; }
    }

    // Dosyada yoksa settings'den dene
    if (!serverKey) serverKey = settings.serverKey || "5XE+DKQ46fl1EgSLWqKV9qkV+nGT4VLBrhJKYUrFbD0=";

    const serverUrl   = `http://${host}:${port}`;
    const apiServer   = `http://${host}:${apiPort}`;
    const relayServer = host;

    const psScript = `# --- RUSTDESK OTOMATIK KURULUM SCRIPT ---
$ErrorActionPreference = "SilentlyContinue"
$hostIp     = "${host}"
$serverKey  = "${serverKey}"
$password   = "${defaultPassword}"
$serverUrl  = "${serverUrl}"
$apiServer  = "${apiServer}"

Write-Host ">> Sistem Hazirlaniyor..." -ForegroundColor Cyan

# 1. Klasor olustur
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }

# 2. RustDesk Indir ve Kur
Write-Host ">> RustDesk Client indiriliyor..." -ForegroundColor Cyan
$url           = "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe"
$setupFilename = "rustdesk-host=$($hostIp)-key=$($serverKey).exe"
$setupPath     = Join-Path $env:TEMP $setupFilename

(New-Object Net.WebClient).DownloadFile($url, $setupPath)
Start-Process $setupPath -ArgumentList "--silent-install" -Wait

# 3. Konfigürasyon Dosyalarini Yaz
$toml = @"
rendezvous_server = '$hostIp'
relay_server = '$hostIp'

[options]
custom-rendezvous-server = '$hostIp'
key = '$serverKey'
relay-server = '$hostIp'
api-server = '$apiServer'
verification-method = 'use-permanent-password'
approve-mode = 'password'
allow-logon-screen-password = 'Y'
enable-remote-desktop = 'Y'
stop-service-on-user-logout = 'N'
permissions = 'all'
enable-uac = 'Y'
enable-remote-restart = 'Y'
hide-tray = 'Y'
hide-stop-service = 'Y'
hide-network-settings = 'Y'
hide-security-settings = 'Y'
disable-change-permanent-password = 'Y'
remove-preset-password-warning = 'Y'
"@

Stop-Service "rustdesk" -ErrorAction SilentlyContinue
Get-Process RustDesk | Stop-Process -Force -ErrorAction SilentlyContinue

$configPaths = @(
    "C:\\ProgramData\\RustDesk\\config",
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config"
)

# Tum kullanici profilleri
Get-ChildItem "C:\\Users" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $configPaths += "$($_.FullName)\\AppData\\Roaming\\RustDesk\\config"
}

foreach ($p in $configPaths) {
    if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path $p "RustDesk2.toml"), $toml, (New-Object System.Text.UTF8Encoding($false)))
    [System.IO.File]::WriteAllText((Join-Path $p "RustDesk.toml"),  $toml, (New-Object System.Text.UTF8Encoding($false)))
}

# 4. Servisi Baslat ve Bekle
Write-Host ">> Servis baslatiliyor..." -ForegroundColor Cyan
Start-Service "rustdesk" -ErrorAction SilentlyContinue
$waited = 0
while ($waited -lt 15) {
    $svc = Get-Service -Name "rustdesk" -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq "Running") { break }
    Start-Sleep -Seconds 1; $waited++
}

# 5. Sifre Ayarla
Write-Host ">> Sifre politikasi uygulaniyor..." -ForegroundColor Cyan
$rd = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") {
    "C:\\Program Files\\RustDesk\\rustdesk.exe"
} else {
    "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe"
}
if ($password -and (Test-Path $rd)) {
    & $rd --password "$password" 2>$null
    Start-Sleep -Seconds 2
    & $rd --set-password "$password" 2>$null
}

# 6. rdrmm:// URI Scheme Handler
Write-Host ">> rdrmm:// URI handler kuruluyor..." -ForegroundColor Cyan
$connectVbs = @"
Set args = WScript.Arguments
Dim id
id = args(0)
If InStr(id, "://") > 0 Then id = Mid(id, InStr(id, "://") + 3)
ElseIf InStr(id, ":") > 0 Then id = Mid(id, InStr(id, ":") + 1)
End If
If Right(id, 1) = "/" Then id = Left(id, Len(id) - 1)
Dim rdExe
rdExe = "C:\\Program Files\\RustDesk\\rustdesk.exe"
If Not CreateObject("Scripting.FileSystemObject").FileExists(rdExe) Then
    rdExe = "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe"
End If
Dim oShell
Set oShell = CreateObject("WScript.Shell")
oShell.Run chr(34) & rdExe & chr(34) & " --connect " & id & " ${defaultPassword}", 1, False
"@
[System.IO.File]::WriteAllText("$rmmDir\\connect.vbs", $connectVbs, (New-Object System.Text.UTF8Encoding($false)))

$regBase = "HKLM:\\SOFTWARE\\Classes\\rdrmm"
New-Item -Path $regBase -Force | Out-Null
Set-ItemProperty -Path $regBase -Name "(Default)" -Value "URL:RustDesk RMM Connection"
New-ItemProperty -Path $regBase -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null
New-Item -Path "$regBase\\DefaultIcon" -Force | Out-Null
Set-ItemProperty -Path "$regBase\\DefaultIcon" -Name "(Default)" -Value "$rd,0"
New-Item -Path "$regBase\\shell\\open\\command" -Force | Out-Null
Set-ItemProperty -Path "$regBase\\shell\\open\\command" -Name "(Default)" -Value "wscript.exe //B \`"$rmmDir\\connect.vbs\`" \`"%1\`""

Write-Host "--- KURULUM TAMAMLANDI! ---" -ForegroundColor Green
`;

    return new Response(psScript, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="install.ps1"'
      }
    });

  } catch (error: any) {
    console.error("Builder Error:", error);
    return NextResponse.json({ error: "Script oluşturulamadı" }, { status: 500 });
  }
}
