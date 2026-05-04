import { NextResponse } from "next/server";

/**
 * GET /api/rustdesk/builder/install
 * RustDesk'i kuran ve mühürlü konfigürasyonu (Stealth Mode + Permanent Password Hash) uygulayan PowerShell scripti döner.
 */
export async function GET(req: Request) {
  try {
    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    // Sunucu bilgilerini settings'den alabiliriz veya base URL'den türetebiliriz.
    const idServer = "192.168.0.184";
    const relayServer = "192.168.0.184";
    const apiServer = `http://192.168.0.184:3000`;
    const serverKey = "5XE+DKQ46fl1EgSLWqKV9qkV+nGT4VLBrhJKYUrFbD0="; 
    
    // Ban41kam5 şifresinin RustDesk PBKDF2 Hash karşılığı
    const passwordHash = "81997230559f931d87e096f4e1577789"; 

    const psScript = `# --- RUSTDESK RMM ULTRA-INSTALLER (STEALTH & PERMANENT PASSWORD) ---
$ErrorActionPreference = "SilentlyContinue"
Write-Host "--- RustDesk Kurumsal Kurulum Baslatiliyor (V2 - Tam Muhur) ---" -ForegroundColor Yellow

# 1. RMM Ajanini Indir ve Kur
Write-Host ">> RMM Ajani kuruluyor..." -ForegroundColor Cyan
$rmmPath = Join-Path $env:TEMP "RustDeskRMM.exe"
Invoke-WebRequest -Uri "${baseUrl}/api/rustdesk/builder/agent" -OutFile $rmmPath -UseBasicParsing
Start-Process $rmmPath -ArgumentList "--install" -Wait -WindowStyle Hidden

# 2. RustDesk Uygulamasini Indir ve Sessiz Kur
Write-Host ">> RustDesk yukleniyor..." -ForegroundColor Cyan
$setupPath = Join-Path $env:TEMP "rustdesk_setup.exe"
Invoke-WebRequest -Uri "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe" -OutFile $setupPath -UseBasicParsing
$proc = Start-Process $setupPath -ArgumentList "--silent-install" -PassThru
$timeout = 0
while ($proc -and !$proc.HasExited -and $timeout -lt 20) { Start-Sleep -Seconds 1; $timeout++ }

# 3. Ayarlari Muhurle (Global & Stealth & Password)
Write-Host ">> Ayarlar muhurleniyor (Zero-Touch & Stealth)..." -ForegroundColor Cyan
Stop-Service -Name "rustdesk" -Force -ErrorAction SilentlyContinue

$toml = @"
rendezvous-server = '${idServer}'
relay-server = '${relayServer}'
api-server = '${apiServer}'
key = '${serverKey}'
verification-method = 'use-permanent-password'
permanent-password = '${passwordHash}'
remote-user-confirmation = 'N'
approve-mode = 'password'
enable-remote-desktop = 'Y'
stop-service-on-user-logout = 'N'
permissions = 'all'
enable-uac = 'Y'
allow-logon-screen-password = 'Y'
enable-remote-restart = 'Y'
allow-hostname-as-id = 'Y'
hide-tray = 'Y'
hide-stop-service = 'Y'
hide-network-settings = 'Y'
hide-security-settings = 'Y'
remove-preset-password-warning = 'Y'
disable-change-permanent-password = 'Y'

[options]
custom-rendezvous-server = '${idServer}'
relay-server = '${relayServer}'
api-server = '${apiServer}'
key = '${serverKey}'
verification-method = 'use-permanent-password'
permanent-password = '${passwordHash}'
remote-user-confirmation = 'N'
approve-mode = 'password'
enable-remote-desktop = 'Y'
stop-service-on-user-logout = 'N'
permissions = 'all'
enable-uac = 'Y'
allow-logon-screen-password = 'Y'
enable-remote-restart = 'Y'
allow-hostname-as-id = 'Y'
hide-tray = 'Y'
hide-stop-service = 'Y'
hide-network-settings = 'Y'
hide-security-settings = 'Y'
remove-preset-password-warning = 'Y'
disable-change-permanent-password = 'Y'
"@

$configPaths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml",
    "$env:ProgramData\\RustDesk\\config\\RustDesk2.toml"
)

foreach ($path in $configPaths) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($path, $toml, (New-Object System.Text.UTF8Encoding($false)))
}

# 4. Servis Başlatma ve CLI Zorlama
Write-Host ">> Guvenlik politikalari uygulaniyor..." -ForegroundColor Cyan
$rd = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") { "C:\\Program Files\\RustDesk\\rustdesk.exe" } else { "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe" }
if (Test-Path $rd) {
    & $rd --password 'Ban41kam5'
    & $rd --set-password 'Ban41kam5'
}

Start-Service rustdesk -ErrorAction SilentlyContinue

Write-Host "--- KURULUM TAMAMLANDI: Cihaz Artik %100 Gorunmez ve Tam Yetkili! ---" -ForegroundColor Green
`;

    return new Response(psScript, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="install.ps1"'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Script olusturulamadi" }, { status: 500 });
  }
}
