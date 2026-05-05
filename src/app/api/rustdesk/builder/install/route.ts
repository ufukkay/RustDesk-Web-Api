import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getSettings();

    const idServer    = searchParams.get("host") || settings.idServer || settings.host;
    const relayServer = settings.relayServer || idServer;
    const apiPort     = searchParams.get("port") || settings.port || "3000";
    const apiServer   = settings.apiServer || `http://${idServer}:${apiPort}`;
    const password    = settings.defaultPassword || "";

    // Sunucu anahtarını dosya sisteminden oku, yoksa settings'den al
    const keyPaths = [
      "C:\\ProgramData\\RustDesk\\config\\id_ed25519.pub",
      "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\id_ed25519.pub",
      path.join(process.cwd(), "id_ed25519.pub"),
    ];
    let serverKey = settings.serverKey || "";
    for (const p of keyPaths) {
      try {
        if (fs.existsSync(p)) { serverKey = fs.readFileSync(p, "utf-8").trim(); break; }
      } catch { continue; }
    }

    const psScript = `# --- RUSTDESK KURULUM SCRIPT ---
$ErrorActionPreference = "SilentlyContinue"
Write-Host "--- RustDesk Kurumsal Kurulum Baslatiliyor ---" -ForegroundColor Yellow

# TLS 1.2 zorla (GitHub icin gerekli)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# 1. RustDesk Indir ve Kur
Write-Host ">> RustDesk yukleniyor..." -ForegroundColor Cyan
$setupPath = Join-Path $env:TEMP "rustdesk_setup.exe"
Invoke-WebRequest -Uri "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe" -OutFile $setupPath -UseBasicParsing

$fileSize = (Get-Item $setupPath -ErrorAction SilentlyContinue).Length
if (-not $fileSize -or $fileSize -lt 5000000) {
    Write-Host "[HATA] Dosya indirilemedi ($fileSize byte)" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dosya indirildi ($([math]::Round($fileSize/1MB,1)) MB)" -ForegroundColor Green

$proc = Start-Process $setupPath -ArgumentList "--silent-install" -PassThru
$timeout = 0
while ($proc -and !$proc.HasExited -and $timeout -lt 30) { Start-Sleep -Seconds 1; $timeout++ }

# Kurulum dogrula
Start-Sleep -Seconds 3
$rd = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") { "C:\\Program Files\\RustDesk\\rustdesk.exe" } else { "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe" }
if (-not (Test-Path $rd)) {
    Write-Host "[HATA] rustdesk.exe bulunamadi, kurulum basarisiz" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] RustDesk kuruldu" -ForegroundColor Green

# 2. Ayarlari Muhurle
Write-Host ">> Ayarlar muhurleniyor..." -ForegroundColor Cyan
Stop-Service -Name "rustdesk" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Get-Process "rustdesk" -ErrorAction SilentlyContinue | Stop-Process -Force

$toml = @"
rendezvous-server = '${idServer}'
relay-server = '${relayServer}'
api-server = '${apiServer}'
key = '${serverKey}'
verification-method = 'use-permanent-password'
permanent-password = '${password}'
approve-mode = 'password'
remote-user-confirmation = 'N'
allow-logon-screen-password = 'Y'
enable-remote-desktop = 'Y'
stop-service-on-user-logout = 'N'
permissions = 'all'
enable-uac = 'Y'
enable-remote-restart = 'Y'
allow-hostname-as-id = 'Y'
hide-tray = 'Y'
hide-stop-service = 'Y'
hide-network-settings = 'Y'
hide-security-settings = 'Y'
disable-change-permanent-password = 'Y'
remove-preset-password-warning = 'Y'

[options]
custom-rendezvous-server = '${idServer}'
relay-server = '${relayServer}'
api-server = '${apiServer}'
key = '${serverKey}'
verification-method = 'use-permanent-password'
permanent-password = '${password}'
approve-mode = 'password'
remote-user-confirmation = 'N'
allow-logon-screen-password = 'Y'
enable-remote-desktop = 'Y'
stop-service-on-user-logout = 'N'
permissions = 'all'
enable-uac = 'Y'
enable-remote-restart = 'Y'
allow-hostname-as-id = 'Y'
hide-tray = 'Y'
hide-stop-service = 'Y'
hide-network-settings = 'Y'
hide-security-settings = 'Y'
disable-change-permanent-password = 'Y'
remove-preset-password-warning = 'Y'
"@

$configPaths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml",
    "$env:ProgramData\\RustDesk\\config\\RustDesk2.toml",
    "$env:USERPROFILE\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml"
)
Get-ChildItem "C:\\Users" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $configPaths += "$($_.FullName)\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml"
}
foreach ($cfgPath in $configPaths) {
    $dir = Split-Path $cfgPath
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($cfgPath, $toml, (New-Object System.Text.UTF8Encoding($false)))
}
Write-Host "[OK] Config yazildi" -ForegroundColor Green

# 3. Servisi baslat
Write-Host ">> Servis baslatiliyor..." -ForegroundColor Cyan
Start-Service rustdesk -ErrorAction SilentlyContinue
$waited = 0
while ($waited -lt 15) {
    $svc = Get-Service -Name "rustdesk" -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq "Running") { break }
    Start-Sleep -Seconds 1; $waited++
}

# 4. CLI ile sifre ayarla
Write-Host ">> Sifre politikasi uygulaniyor..." -ForegroundColor Cyan
if (Test-Path $rd) {
    & $rd --password '${password}' 2>$null
    Start-Sleep -Seconds 2
    & $rd --set-password '${password}' 2>$null
}

# 5. rdrmm:// URI Scheme Handler
Write-Host ">> rdrmm:// URI handler kuruluyor..." -ForegroundColor Cyan
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
New-Item -ItemType Directory -Force -Path $rmmDir | Out-Null

$connectVbs = @'
Set args = WScript.Arguments
Dim id
id = args(0)
id = Replace(id, "rdrmm://", "")
id = Replace(id, "/", "")

Dim rdExe
rdExe = "C:\Program Files\RustDesk\rustdesk.exe"
If Not CreateObject("Scripting.FileSystemObject").FileExists(rdExe) Then
    rdExe = "C:\Program Files (x86)\RustDesk\rustdesk.exe"
End If

Dim oShell
Set oShell = CreateObject("WScript.Shell")
oShell.Run "cmd /c echo ${password}| clip", 0, True
oShell.Run """" & rdExe & """ --connect " & id, 1, False
'@
[System.IO.File]::WriteAllText("$rmmDir\\connect.vbs", $connectVbs, (New-Object System.Text.UTF8Encoding($false)))

$regBase = "HKLM:\\SOFTWARE\\Classes\\rdrmm"
New-Item -Path $regBase -Force | Out-Null
Set-ItemProperty -Path $regBase -Name "(Default)" -Value "URL:RustDesk RMM Connection"
New-ItemProperty -Path $regBase -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null
New-Item -Path "$regBase\\DefaultIcon" -Force | Out-Null
Set-ItemProperty -Path "$regBase\\DefaultIcon" -Name "(Default)" -Value "$rd,0"
New-Item -Path "$regBase\\shell\\open\\command" -Force | Out-Null
Set-ItemProperty -Path "$regBase\\shell\\open\\command" -Name "(Default)" -Value "wscript.exe //B \`"$rmmDir\\connect.vbs\`" \`"%1\`""

$rdId = (& $rd --get-id 2>$null) -replace '\s',''
Write-Host ""
Write-Host "--- KURULUM TAMAMLANDI ---" -ForegroundColor Green
Write-Host "Sunucu : ${idServer}" -ForegroundColor White
if ($rdId) { Write-Host "Cihaz ID: $rdId" -ForegroundColor Yellow }
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
