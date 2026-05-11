import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getSettings();
    
    // Header'lardan baz URL'i al (HTTPS uyumu için)
    const hostHeader = req.headers.get("host");
    const currentHost = hostHeader?.split(":")[0] || "rmm.talay.com";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    
    // Domain algılandıysa IP yerine her zaman domain kullanalım
    let baseUrl = settings.apiServer;
    if (hostHeader && !hostHeader.includes("192.168.")) {
       baseUrl = `${protocol}://${hostHeader}`;
    } else if (!baseUrl) {
       baseUrl = `${protocol}://${hostHeader}`;
    }

    let idServer = searchParams.get("host") || settings.idServer || settings.host || currentHost;
    
    // Domain tespiti ve zorlama
    if (currentHost.includes("talay.com")) {
      idServer = "rmm.talay.com";
    }


    const relayServer = settings.relayServer && settings.relayServer !== "192.168.0.184" ? settings.relayServer : idServer;
    const apiServer   = baseUrl;
    const password    = settings.defaultPassword || "Ban41kam5";

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

# 0. Yonetici Kontrolu
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[HATA] Bu scripti Administrator (Yonetici) olarak calistirmalisiniz!" -ForegroundColor Red
    exit 1
}

Write-Host "--- RustDesk Kurumsal Kurulum Baslatiliyor ---" -ForegroundColor Yellow

# TLS 1.2 zorla + SSL bypass
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
[Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

# 1. RustDesk Indir ve Kur
Write-Host ">> RustDesk yukleniyor..." -ForegroundColor Cyan
$setupPath = Join-Path $env:TEMP "rustdesk_setup.exe"
$rdUrl = "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe"

# Yontem 1: curl.exe (.NET TLS'den bagimsiz)
if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
    curl.exe -L -s --ssl-no-revoke -o $setupPath $rdUrl 2>$null
}
# Yontem 2: bitsadmin fallback
$fileSize = (Get-Item $setupPath -ErrorAction SilentlyContinue).Length
if (-not $fileSize -or $fileSize -lt 5000000) {
    bitsadmin /transfer "rdsetup" /download $rdUrl $setupPath 2>$null | Out-Null
}
# Yontem 3: Invoke-WebRequest (hata propagate etmemesi icin SilentlyContinue)
$fileSize = (Get-Item $setupPath -ErrorAction SilentlyContinue).Length
if (-not $fileSize -or $fileSize -lt 5000000) {
    Invoke-WebRequest -Uri $rdUrl -OutFile $setupPath -UseBasicParsing -ErrorAction SilentlyContinue
}

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

$toml1 = @"
rendezvous_server = '${idServer}'
"@

$toml2 = @"
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

$profileDirs = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config",
    "$env:ProgramData\\RustDesk\\config",
    "$env:USERPROFILE\\AppData\\Roaming\\RustDesk\\config"
)
Get-ChildItem "C:\\Users" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $profileDirs += "$($_.FullName)\\AppData\\Roaming\\RustDesk\\config"
}
foreach ($dir in $profileDirs) {
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText("$dir\\RustDesk.toml",  $toml1, (New-Object System.Text.UTF8Encoding($false)))
    [System.IO.File]::WriteAllText("$dir\\RustDesk2.toml", $toml2, (New-Object System.Text.UTF8Encoding($false)))
}
Write-Host "[OK] Config yazildi" -ForegroundColor Green

# 3. Servisi baslat
Write-Host ">> Servis baslatiliyor..." -ForegroundColor Cyan
Start-Service rustdesk -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 4. CLI ile sifre ayarla
Write-Host ">> Sifre politikasi uygulaniyor..." -ForegroundColor Cyan
if (Test-Path $rd) {
    & $rd --password '${password}' 2>$null
    Start-Sleep -Seconds 1
    & $rd --set-password '${password}' 2>$null
}

# 5. RMM Ajani Kurulumu (Agent V2 - Real-time WebSocket & WMI Telemetry)
Write-Host ">> RMM Ajani (Agent V2) kuruluyor..." -ForegroundColor Cyan
$agentSetupUrl = "${apiServer}/api/agent/setup"
try {
    $tempPs1 = Join-Path $env:TEMP "agent_setup.ps1"
    (New-Object System.Net.WebClient).DownloadFile($agentSetupUrl, $tempPs1)
    Write-Host ">> Ajan betigi indirildi, calistiriliyor..." -ForegroundColor Gray
    # setup.ps1 dosyasinin en basina param($apiServer) eklenmesi gerektigi varsayilarak:
    & powershell.exe -ExecutionPolicy Bypass -File $tempPs1 -apiServer "${apiServer}"
} catch {
    Write-Host "[HATA] RMM Ajani indirilemedi veya calistirilemedi: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. rdrmm:// URI Scheme Handler
Write-Host ">> rdrmm:// URI handler kuruluyor..." -ForegroundColor Cyan
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }
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
oShell.Run """" & rdExe & """ --connect " & id & " ${password}", 1, False
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

Write-Host ""
Write-Host "--- KURULUM TAMAMLANDI ---" -ForegroundColor Green
Write-Host "Sunucu : ${idServer}" -ForegroundColor White
if ($rdId) { Write-Host "Cihaz ID: $rdId" -ForegroundColor Yellow }
Write-Host ""
Write-Host "Lutfen paneli kontrol edin..." -ForegroundColor Gray

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
