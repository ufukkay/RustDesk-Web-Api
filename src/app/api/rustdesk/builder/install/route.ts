import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    const idServer = "192.168.0.184";
    const relayServer = "192.168.0.184";
    const apiServer = `http://192.168.0.184:3000`;
    const serverKey = "5XE+DKQ46fl1EgSLWqKV9qkV+nGT4VLBrhJKYUrFbD0=";
    const passwordHash = "81997230559f931d87e096f4e1577789";

    const psScript = `# --- RUSTDESK RMM ULTRA-INSTALLER ---
$ErrorActionPreference = "SilentlyContinue"
Write-Host "--- RustDesk Kurumsal Kurulum Baslatiliyor ---" -ForegroundColor Yellow

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

# 3. Ayarlari Muhurle - Password mode (kilitli oturum dahil calisir)
Write-Host ">> Ayarlar muhurleniyor..." -ForegroundColor Cyan
Stop-Service -Name "rustdesk" -Force -ErrorAction SilentlyContinue

$toml = @"
rendezvous-server = '${idServer}'
relay-server = '${relayServer}'
api-server = '${apiServer}'
key = '${serverKey}'
verification-method = 'use-permanent-password'
permanent-password = '${passwordHash}'
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
permanent-password = '${passwordHash}'
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

# Sistem config path'leri
$configPaths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml",
    "$env:ProgramData\\RustDesk\\config\\RustDesk2.toml",
    "$env:USERPROFILE\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml"
)

# Tum kullanici profilleri
Get-ChildItem "C:\\Users" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $configPaths += "$($_.FullName)\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml"
}

foreach ($path in $configPaths) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($path, $toml, (New-Object System.Text.UTF8Encoding($false)))
}

# 4. CLI ile sifre zorla (aktif kullanici profili icin)
Write-Host ">> Sifre politikasi uygulaniyor..." -ForegroundColor Cyan
$rd = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") { "C:\\Program Files\\RustDesk\\rustdesk.exe" } else { "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe" }
if (Test-Path $rd) {
    & $rd --password 'Ban41kam5' 2>$null
    & $rd --set-password 'Ban41kam5' 2>$null
}

Start-Service rustdesk -ErrorAction SilentlyContinue

# 5. rdrmm:// URI Scheme Handler Kurulumu (tüm kullanıcılar için)
Write-Host ">> rdrmm:// URI handler kuruluyor..." -ForegroundColor Cyan
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
New-Item -ItemType Directory -Force -Path $rmmDir | Out-Null

$connectVbs = @'
Set args = WScript.Arguments
Dim id
id = args(0)
id = Replace(id, "rdrmm://", "")
Dim rdExe
rdExe = "C:\Program Files\RustDesk\rustdesk.exe"
If Not CreateObject("Scripting.FileSystemObject").FileExists(rdExe) Then
    rdExe = "C:\Program Files (x86)\RustDesk\rustdesk.exe"
End If
CreateObject("WScript.Shell").Run """" & rdExe & """ --connect " & id & " Ban41kam5", 0, False
'@
[System.IO.File]::WriteAllText("$rmmDir\\connect.vbs", $connectVbs, (New-Object System.Text.UTF8Encoding($false)))

# HKLM ile tüm kullanıcılara kaydet (admin yetkisi mevcut)
$regBase = "HKLM:\\SOFTWARE\\Classes\\rdrmm"
New-Item -Path $regBase -Force | Out-Null
Set-ItemProperty -Path $regBase -Name "(Default)" -Value "URL:RustDesk RMM Connection"
New-ItemProperty -Path $regBase -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null
New-Item -Path "$regBase\\DefaultIcon" -Force | Out-Null
Set-ItemProperty -Path "$regBase\\DefaultIcon" -Name "(Default)" -Value "$rd,0"
New-Item -Path "$regBase\\shell\\open\\command" -Force | Out-Null
Set-ItemProperty -Path "$regBase\\shell\\open\\command" -Name "(Default)" -Value "wscript.exe //B \`"$rmmDir\\connect.vbs\`" \`"%1\`""

Write-Host "--- KURULUM TAMAMLANDI: RustDesk + RMM Agent + rdrmm:// Handler hazir! ---" -ForegroundColor Green
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
