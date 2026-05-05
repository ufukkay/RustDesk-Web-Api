import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/uninstall
 * RustDesk ve RMM ajanını sistemden tamamen kaldıran bir PowerShell scripti döner.
 */
export async function GET(req: Request) {
  try {
    const settings = getSettings();
    const hostHeader = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = settings.apiServer || `${protocol}://${hostHeader}`;

    const psScript = `# --- RUSTDESK RMM UNINSTALLER ---
# Bu script RustDesk ve RMM ajanını sistemden temizler ve panelden siler.

$ErrorActionPreference = "SilentlyContinue"

# 0. Yonetici Kontrolu
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[HATA] Bu scripti Administrator (Yonetici) olarak calistirmalisiniz!" -ForegroundColor Red
    exit 1
}

Write-Host "--- RustDesk RMM Kaldirma Islemi Baslatiliyor ---" -ForegroundColor Yellow

# 1. Panelden Silme İsteği Gönder
Write-Host ">> Panelden silme istegi gonderiliyor..." -ForegroundColor Cyan
$rdExe = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") { "C:\\Program Files\\RustDesk\\rustdesk.exe" } else { "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe" }
$id = ""
if (Test-Path $rdExe) {
    $id = (& $rdExe --get-id 2>$null) -replace '\\s',''
}
if (!$id) {
    $id = $env:COMPUTERNAME
}

try {
    $body = @{ id = "$id" } | ConvertTo-Json
    Invoke-RestMethod -Uri "${baseUrl}/api/rustdesk/devices" -Method DELETE -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host ">> Cihaz panel listesinden kaldirildi." -ForegroundColor Green
} catch {
    Write-Host ">> Panel baglantisi kurulamadi, manuel silmeniz gerekebilir." -ForegroundColor Red
}

# 2. RMM Ajanını Durdur ve Sil
Write-Host ">> RMM Ajani durduruluyor..." -ForegroundColor Cyan
taskkill /F /IM RustDeskRMM.exe /T 2>$null
Unregister-ScheduledTask -TaskName "RustDeskRMM_Service" -Confirm:$false 2>$null

$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (Test-Path $rmmDir) {
    Write-Host ">> RMM dosyalari siliniyor..." -ForegroundColor Cyan
    Remove-Item -Path $rmmDir -Recurse -Force 2>$null
}

# 3. RustDesk Uygulamasını Kaldır
Write-Host ">> RustDesk kaldiriliyor..." -ForegroundColor Cyan
if (Test-Path $rdExe) {
    Start-Process $rdExe -ArgumentList "--uninstall" -Wait -WindowStyle Hidden
}

# RustDesk Servisini temizle (Eger kaldiysa)
Stop-Service "rustdesk" 2>$null
sc.exe delete "rustdesk" 2>$null

# 4. Yapılandırma ve Veri Dosyalarını Tamamen Temizle
Write-Host ">> Yapilandirma ve AppData dosyalari temizleniyor..." -ForegroundColor Cyan

$configPaths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk",
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Local\\RustDesk",
    "$env:ProgramData\\RustDesk",
    "$env:AppData\\RustDesk",
    "$env:LocalAppData\\RustDesk"
)

# Tüm kullanıcıların AppData klasörlerini tara
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

# 5. URI Handler Kayıtlarını Sil
Remove-Item -Path "HKLM:\\SOFTWARE\\Classes\\rdrmm" -Recurse -Force 2>$null

Write-Host "------------------------------------------------" -ForegroundColor Yellow
Write-Host "ISLEM TAMAMLANDI: RustDesk ve RMM Ajani Tamamen Silindi! ✅" -ForegroundColor Green
Write-Host "BITTI" -ForegroundColor White -BackgroundColor Green
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

