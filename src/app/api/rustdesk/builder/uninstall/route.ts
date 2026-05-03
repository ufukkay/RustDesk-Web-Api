import { NextResponse } from "next/server";

/**
 * GET /api/rustdesk/builder/uninstall
 * RustDesk ve RMM ajanını sistemden tamamen kaldıran bir PowerShell scripti döner.
 */
export async function GET() {
  try {
    const psScript = `# --- RUSTDESK RMM UNINSTALLER ---
# Bu script RustDesk ve RMM ajanını sistemden temizler.

$ErrorActionPreference = "SilentlyContinue"

Write-Host "--- RustDesk RMM Kaldırma Islemi Baslatiliyor ---" -ForegroundColor Yellow

# 1. RMM Ajanını Durdur ve Sil
Write-Host ">> RMM Ajani durduruluyor..." -ForegroundColor Cyan
taskkill /F /IM RustDeskRMM.exe /T 2>$null
Unregister-ScheduledTask -TaskName "RustDeskRMM_Service" -Confirm:$false 2>$null

$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (Test-Path $rmmDir) {
    Write-Host ">> RMM dosyalari siliniyor..." -ForegroundColor Cyan
    Remove-Item -Path $rmmDir -Recurse -Force 2>$null
}

# 2. RustDesk Uygulamasını Kaldır
Write-Host ">> RustDesk kaldiriliyor..." -ForegroundColor Cyan
$rdExe = "C:\\Program Files\\RustDesk\\rustdesk.exe"
if (Test-Path $rdExe) {
    # Uninstall komutunu sessiz modda calistirmaya calis
    Start-Process $rdExe -ArgumentList "--uninstall" -Wait -WindowStyle Hidden
}

# RustDesk Servisini temizle (Eger kaldiysa)
Stop-Service "rustdesk" 2>$null
sc.exe delete "rustdesk" 2>$null

# 3. Yapılandırma ve Veri Dosyalarını Tamamen Temizle
Write-Host ">> Yapılandırma ve AppData dosyalari temizleniyor..." -ForegroundColor Cyan

$configPaths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk",
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Local\\RustDesk",
    "$env:ProgramData\\RustDesk",
    "$env:AppData\\RustDesk",
    "$env:LocalAppData\\RustDesk"
)

# Tum kullanicilarin AppData klasorlerini tara (Gelistirilmis temizlik)
$userProfiles = Get-ChildItem "C:\\Users"
foreach ($user in $userProfiles) {
    $userPaths = @(
        "C:\\Users\\$($user.Name)\\AppData\\Roaming\\RustDesk",
        "C:\\Users\\$($user.Name)\\AppData\\Local\\RustDesk"
      )
    foreach ($up in $userPaths) {
        if (Test-Path $up) {
            Remove-Item -Path $up -Recurse -Force 2>$null
        }
    }
}

foreach ($path in $configPaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force 2>$null
    }
}

Write-Host "------------------------------------------------" -ForegroundColor Yellow
Write-Host "ISLEM TAMAMLANDI: RustDesk ve RMM Ajani Tamamen Silindi! ✅" -ForegroundColor Green
Write-Host "BİTTİ" -ForegroundColor White -BackgroundColor Green
`;

    return new Response(psScript, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="uninstall.ps1"'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Script olusturulamadi" }, { status: 500 });
  }
}
