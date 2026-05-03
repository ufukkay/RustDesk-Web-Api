import { NextResponse } from "next/server";

/**
 * GET /api/rustdesk/builder/uninstall
 * RMM Ajanını ve RustDesk'i sistemden tamamen kaldıran script döner.
 */
export async function GET(req: Request) {
  const uninstallScript = `# --- RUSTDESK RMM UNINSTALLER ---
Write-Host "--- RustDesk RMM Kaldirma Islemi Baslatiliyor ---" -ForegroundColor Yellow

# 1. RMM Ajanini Durdur ve Sil
Write-Host ">> RMM Ajani durduruluyor..." -ForegroundColor Cyan
taskkill /F /IM RustDeskRMM.exe /T 2>$null
$taskName = "RustDeskRMM_Service"
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# 2. Dosyalari Temizle
$dir = "C:\\ProgramData\\RustDeskRMM"
if (Test-Path $dir) {
    Write-Host ">> RMM dosyalari siliniyor..." -ForegroundColor Cyan
    Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
}

# 3. RustDesk'i Kaldir (Opsiyonel - Kullanici isterse)
if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") {
    Write-Host ">> RustDesk kaldiriliyor..." -ForegroundColor Cyan
    Start-Process "C:\\Program Files\\RustDesk\\rustdesk.exe" -ArgumentList "--uninstall" -Wait
}

Write-Host "------------------------------------------------" -ForegroundColor Yellow
Write-Host "ISLEM TAMAMLANDI: RMM Ajani ve RustDesk sistemden kaldirildi. ✅" -ForegroundColor Green
Write-Host "BİTTİ" -ForegroundColor White -BackgroundColor Red
`;

  return new Response(uninstallScript, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="uninstall.ps1"'
    }
  });
}
