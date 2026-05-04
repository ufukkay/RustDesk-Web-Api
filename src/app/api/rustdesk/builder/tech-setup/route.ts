import { NextResponse } from "next/server";

/**
 * GET /api/rustdesk/builder/tech-setup
 * Artık bu adım install scripti içine gömüldü.
 * Geriye dönük uyumluluk için endpoint korunuyor.
 */
export async function GET() {
  const psScript = `# --- RUSTDESK RMM TEKNISYEN KURULUMU ---
# Bu script tekniysyen makinesinde BIR KEZ calistirilir.
# rdrmm:// URI scheme handler kurarak dashboard'dan sifresiz baglanti saglar.
$ErrorActionPreference = "SilentlyContinue"
Write-Host "RustDesk RMM Teknisyen Kurulumu Baslatiliyor..." -ForegroundColor Yellow

$dir = "C:\\ProgramData\\RustDeskRMM"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

# Baglanti handler VBScript (gorunmez pencere, dogrudan RustDesk'i acar)
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
[System.IO.File]::WriteAllText("$dir\\connect.vbs", $connectVbs, (New-Object System.Text.UTF8Encoding($false)))

# rdrmm:// URI scheme kaydet (HKCU - admin gerektirmez)
$key = "HKCU:\\Software\\Classes\\rdrmm"
New-Item -Path $key -Force | Out-Null
Set-ItemProperty -Path $key -Name "(Default)" -Value "URL:RustDesk RMM Connection"
New-ItemProperty -Path $key -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null
New-Item -Path "$key\\DefaultIcon" -Force | Out-Null
Set-ItemProperty -Path "$key\\DefaultIcon" -Name "(Default)" -Value "C:\\Program Files\\RustDesk\\rustdesk.exe,0"
New-Item -Path "$key\\shell\\open\\command" -Force | Out-Null
Set-ItemProperty -Path "$key\\shell\\open\\command" -Name "(Default)" -Value "wscript.exe //B \`"$dir\\connect.vbs\`" \`"%1\`""

Write-Host "Kurulum tamamlandi!" -ForegroundColor Green
Write-Host "Artik dashboard'dan 'Uzaktan Baglan' butonuyla sifresiz baglanti kurabilirsiniz." -ForegroundColor Cyan
Write-Host "NOT: Tarayiciniz ilk kullanimda 'rdrmm:// ac?' diye soracak - 'Her zaman ac' secin." -ForegroundColor Yellow
`;

  return new Response(psScript, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tech-setup.ps1"'
    }
  });
}
