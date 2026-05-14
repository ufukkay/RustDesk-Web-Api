import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getSettings();
    
    const hostHeader = req.headers.get("host") || "";
    const currentHost = hostHeader.split(":")[0];
    
    // Sunucu adresini belirle (HTTPS ve Domain zorlaması)
    let baseUrl = settings.apiServer || `https://${currentHost}`;
    if (currentHost.includes("talay.com") || currentHost.includes("192.168.")) {
        baseUrl = "https://rmm.talay.com";
    }

    let idServer = searchParams.get("host") || settings.idServer || settings.host || currentHost;
    if (idServer.includes("192.168.") || currentHost.includes("talay.com")) {
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
        const psScript = `<#
.SYNOPSIS
    Talay RMM Pro Unified Installer v5.0
    Professional, Automated, Enterprise Grade.
#>

$ErrorActionPreference = "SilentlyContinue"
$apiServer = "${apiServer}"
$idServer  = "${idServer}"
$key       = "${serverKey}"
$pass      = "${password}"

# --- GORSEL FONKSIYONLAR ---
function Show-Logo {
    Clear-Host
    Write-Host @"
  _______   _              _____  __  __ __  __ 
 |__   __| | |            |  __ \|  \/  |  \/  |
    | | __ | | __ _ _   _ | |__) | \  / | \  / |
    | |/ _` | |/ _` | | | ||  _  /| |\/| | |\/| |
    | | (_| | | (_| | |_| || | \ \| |  | | |  | |
    |_|\__,_|_|\__,_|\__, ||_|  \_\_|  |_|_|  |_|
                      __/ |                     
                     |___/  UNIFIED INSTALLER v5.0
"@ -ForegroundColor Yellow
    Write-Host "------------------------------------------------" -ForegroundColor Gray
}

function Write-Step ([int]$step, [string]$msg) {
    Write-Host "[$step/6] $msg..." -ForegroundColor Cyan
}

# --- 0. HAZIRLIK ---
Show-Logo
Write-Step 1 "Yönetici yetkileri ve sistem kontrol ediliyor"
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[HATA] Lütfen PowerShell'i 'Yönetici Olarak Çalıştır' seçeneğiyle açın." -ForegroundColor Red
    exit 1
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
[Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

# --- 1. RUSTDESK KURULUM ---
Write-Step 2 "RustDesk kurumsal paketi indiriliyor"
$setupPath = Join-Path $env:TEMP "rustdesk_setup.exe"
$rdUrl = "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe"

if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
    curl.exe -L -s --ssl-no-revoke -o $setupPath $rdUrl
} else {
    Invoke-WebRequest -Uri $rdUrl -OutFile $setupPath -UseBasicParsing
}

Write-Host ">> Kurulum başlatılıyor..." -ForegroundColor Gray
$proc = Start-Process $setupPath -ArgumentList "--silent-install" -PassThru -Wait
Start-Sleep -Seconds 3

$rd = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") { "C:\\Program Files\\RustDesk\\rustdesk.exe" } else { "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe" }
if (!(Test-Path $rd)) { Write-Host "[HATA] RustDesk kurulamadı." -ForegroundColor Red; exit 1 }

# --- 2. AYARLARIN MUHURLENMESI ---
Write-Step 3 "Kurumsal ağ ayarları mühürleniyor"
Stop-Service -Name "rustdesk" -Force -ErrorAction SilentlyContinue
Get-Process "rustdesk" -ErrorAction SilentlyContinue | Stop-Process -Force

$toml1 = "rendezvous_server = '$idServer'"
$toml2 = @"
[options]
custom-rendezvous-server = '$idServer'
relay-server = '${relayServer}'
api-server = '$apiServer'
key = '$key'
verification-method = 'use-permanent-password'
permanent-password = '$pass'
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

$profileDirs = @("C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config", "$env:ProgramData\\RustDesk\\config")
Get-ChildItem "C:\\Users" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $profileDirs += "$($_.FullName)\\AppData\\Roaming\\RustDesk\\config"
}
foreach ($d in $profileDirs) {
    if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    [System.IO.File]::WriteAllText("$d\\RustDesk.toml",  $toml1, (New-Object System.Text.UTF8Encoding($false)))
    [System.IO.File]::WriteAllText("$d\\RustDesk2.toml", $toml2, (New-Object System.Text.UTF8Encoding($false)))
}
Start-Service rustdesk -ErrorAction SilentlyContinue
& $rd --password '$pass' 2>$null
& $rd --set-password '$pass' 2>$null

# --- 3. RMM AJANI KURULUMU ---
Write-Step 4 "Talay RMM Pro Ajanı (WebSocket) yapılandırılıyor"
$agentSetupUrl = "$apiServer/api/agent/setup"
try {
    $tempPs1 = Join-Path $env:TEMP "agent_setup.ps1"
    (New-Object System.Net.WebClient).DownloadFile($agentSetupUrl, $tempPs1)
    & powershell.exe -ExecutionPolicy Bypass -File $tempPs1
} catch {
    Write-Host "[!] Ajan kurulumunda hata oluştu, manuel kontrol gerekebilir." -ForegroundColor Yellow
}

# --- 4. URI HANDLER ---
Write-Step 5 "Hızlı bağlantı protokolleri (rdrmm://) kaydediliyor"
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }
$connectVbs = @"
Set args = WScript.Arguments
id = Replace(Replace(args(0), "rdrmm://", ""), "/", "")
Set oShell = CreateObject("WScript.Shell")
oShell.Run """$rd"" --connect " & id & " $pass", 1, False
"@
[System.IO.File]::WriteAllText("$rmmDir\\connect.vbs", $connectVbs, (New-Object System.Text.UTF8Encoding($false)))

$regBase = "HKLM:\\SOFTWARE\\Classes\\rdrmm"
New-Item -Path $regBase -Force | Out-Null
Set-ItemProperty -Path $regBase -Name "(Default)" -Value "URL:RustDesk RMM Connection"
New-ItemProperty -Path $regBase -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null
New-Item -Path "$regBase\\shell\\open\\command" -Force | Out-Null
Set-ItemProperty -Path "$regBase\\shell\\open\\command" -Name "(Default)" -Value "wscript.exe //B \`"$rmmDir\\connect.vbs\`" \`"%1\`""

# --- 5. FINAL ---
Write-Step 6 "Sistem optimizasyonu tamamlanıyor"
Write-Host "\`n------------------------------------------------" -ForegroundColor Gray
Write-Host "TEBRİKLER: Kurumsal Kurulum Başarıyla Tamamlandı! ✅" -ForegroundColor Green
Write-Host "Lütfen RMM Panelini kontrol edin." -ForegroundColor White
Write-Host "------------------------------------------------\`n" -ForegroundColor Gray
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
