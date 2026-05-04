import { NextResponse } from "next/server";

/**
 * GET /api/rustdesk/builder/install
 * RustDesk'i kuran ve mühürlü konfigürasyonu (Stealth Mode + Auto-ID) uygulayan PowerShell scripti döner.
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
    const serverKey = "6m9H667G7oZ777v7l7l7y7l7l7y7l7l7y7l7l7y7="; // Placeholder, gerçek key ile değiştirilmeli

    const psScript = `# --- RUSTDESK RMM AUTO-INSTALLER (STEALTH & LOCKED) ---
$ErrorActionPreference = "SilentlyContinue"
Write-Host "--- RustDesk Kurumsal Kurulum Baslatiliyor ---" -ForegroundColor Yellow

# 1. RMM Ajanini Indir ve Kur (Arka Planda Sinyal Göndermek İçin)
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

# 3. Ayarlari Mühürle (Global & Stealth)
Write-Host ">> Ayarlar muhurleniyor (Zero-Touch & Stealth)..." -ForegroundColor Cyan
Stop-Service -Name "rustdesk" -Force -ErrorAction SilentlyContinue

$toml = @"
rendezvous-server = '${idServer}'
relay-server = '${relayServer}'
api-server = '${apiServer}'
key = '${serverKey}'
verification-method = 'use-permanent-password'
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

# 4. Şifreleme ve Servis Başlatma (Dual-Password Force)
Write-Host ">> Guvenlik politikaları uygulaniyor..." -ForegroundColor Cyan
$rd = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") { "C:\\Program Files\\RustDesk\\rustdesk.exe" } else { "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe" }
if (Test-Path $rd) {
    & $rd --config rendezvous-server=${idServer},relay-server=${relayServer},api-server=${apiServer},key=${serverKey},remote-user-confirmation=N,approve-mode=password,allow-hostname-as-id=Y,hide-tray=Y,hide-stop-service=Y,hide-network-settings=Y,hide-security-settings=Y
    & $rd --password 'Ban41kam5'
    & $rd --set-password 'Ban41kam5'
}

Start-Service rustdesk -ErrorAction SilentlyContinue

Write-Host "--- KURULUM TAMAMLANDI: Cihaz Artık Görünmez ve Tam Yetkili! ---" -ForegroundColor Green
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
