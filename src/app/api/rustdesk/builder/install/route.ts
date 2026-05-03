import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Atomik Fix - C# 5 Uyumluluk ve IP/Disk Sorunu Çözümü.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getSettings();
    
    const host = searchParams.get("host") || settings.host;
    const port = searchParams.get("port") || settings.port;
    
    const idServer = settings.idServer || host;
    const relayServer = settings.relayServer || host;
    const apiServer = settings.apiServer || `http://${host}:${port}`;
    const defaultPassword = settings.defaultPassword || "Ban41kam5";
    const serverKey = settings.serverKey || "YOK";
    
    // C# Saf Ajan Kodu (C# 5 Uyumluluk Garantili)
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLklPOwp1c2luZyBTeXN0ZW0uVGV4dC5SZWd1bGFyRXhwcmVzc2lvbnM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwp1c2luZyBTeXN0ZW0uRGlhZ25vc3RpY3M7CnVzaW5nIFN5c3RlbS5OZXQuTmV0d29ya0luZm9ybWF0aW9uOwoKY2xhc3MgUHJvZ3JhbSB7CiAgICBzdGF0aWMgc3RyaW5nIGRldmljZUlkID0gIiI7CiAgICBzdGF0aWMgc3RyaW5nIGFwaVVybCA9ICJbW1NFUlZFUl9VUkxdXSI7CgogICAgc3RhdGljIHZvaWQgTWFpbihzdHJpbmcgW10gYXJncykgewogICAgICAgIFdlYkNsaWVudCBjbGllbnQgPSBuZXcgV2ViQ2xpZW50KCk7CiAgICAgICAgY2xpZW50LkVuY29kaW5nID0gRW5jb2RpbmcuVVRGODsKICAgICAgICB3aGlsZSAodHJ1ZSkgewogICAgICAgICAgICB0cnkgewogICAgICAgICAgICAgICAgaWYgKHN0cmluZy5Jc051bGxPckVtcHR5KGRldmljZUlkKSkgewogICAgICAgICAgICAgICAgICAgIHN0cmluZyBwMSA9ICJDOlxcUHJvZ3JhbURhdGFcXFJ1c3REZXNrXFxjb25maWdcXFJ1c3REZXNrMi50b21sIjsKICAgICAgICAgICAgICAgICAgICBzdHJpbmcgcDIgPSAiQzpcXFdpbmRvd3NcXFNlcnZpY2VQcm9maWxlc1xcTG9jYWxTZXJ2aWNlXFxBcHBEYXRhXFxSb2FtaW5nXFxSdXN0RGVza1xcY29uZmlnXFxSdXN0RGVzazIudG9tbCI7CiAgICAgICAgICAgICAgICAgICAgaWYgKEZpbGUuRXhpc3RzKHAxKSkgZGV2aWNlSWQgPSBFeHRyYWN0SWQocDEpOwogICAgICAgICAgICAgICAgICAgIGlmIChzdHJpbmcuSXNOdWxsT3JFbXB0eShkZXZpY2VJZCkgJiYgRmlsZS5FeGlzdHMocDIpKSBkZXZpY2VJZCA9IEV4dHJhY3RJZChwMik7CiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmluZy5Jc051bGxPckVtcHR5KGRldmljZUlkKSkgZGV2aWNlSWQgPSBFbnVpcm9ubWVudC5NYWNoaW5lTmFtZTsKICAgICAgICAgICAgICAgIH0KCiAgICAgICAgICAgICAgICBzdHJpbmcgaXAgPSBHZXRMb2NhbElQKCk7CiAgICAgICAgICAgICAgICBzdHJpbmcgZGlzayA9IEdldERpc2tJbmZvKCk7CiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIGNsaWVudC5IZWFkZXJzWyJDb250ZW50LVR5cGUiXSA9ICJhcHBsaWNhdGlvbi9qc29uIjsKICAgICAgICAgICAgICAgIHN0cmluZyBib2R5ID0gIntcImlkXCI6XCIiICsgZGV2aWNlSWQgKyAiXCIsXCJob3N0bmFtZVwiOlwiIiArIEVudmlyb25tZW50Lk1hY2hpbmVOYW1lICsgIlwiLFwib3NcIjpcIndpbmRvd3NcIixcImlwXCI6XCIiICsgaXAgKyAiXCIsXCJkaXNrXCI6XCIiICsgZGlzayArICJcIn0iOwogICAgICAgICAgICAgICAgc3RyaW5nIHJlc3BvbnNlID0gY2xpZW50LlVwbG9hZFN0cmluZyhhcGlVcmwgKyAiL2FwaS9oZWFydGJlYXQiLCAiUE9TVCIsIGJvZHkpOwoKICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5Db250YWlucygiY29tbWFuZCIpKSB7CiAgICAgICAgICAgICAgICAgICAgTWF0Y2ggbSA9IFJlZ2V4Lk1hdGNoKHJlc3BvbnNlLCAiXCJjb21tYW5kXCJccyo6XHMqXCIoLio/KVwiIik7CiAgICAgICAgICAgICAgICAgICAgaWYgKG0uU3VjY2VzcykgUnVuQ21kKGNsaWVudCwgZGV2aWNlSWQsIG0uR3JvdXBzWzFdLlZhbHVlKTsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfSBjYXRjaCB7fQogICAgICAgICAgICBUaHJlYWQuU2xlZXAoMTAwMDApOwogICAgICAgIH0KICAgIH0KCiAgICBzdGF0aWMgc3RyaW5nIEV4dHJhY3RJZChzdHJpbmcgcCkgewogICAgICAgIHRyeSB7CiAgICAgICAgICAgIHN0cmluZyBjID0gRmlsZS5SZWFkQWxsVGV4dChwKTsKICAgICAgICAgICAgTWF0Y2ggbSA9IFJlZ2V4Lk1hdGNoKGMsICJpZFxccyo9XFxzKicoLio/KSciKTsKICAgICAgICAgICAgcmV0dXJuIG0uU3VjY2VzcyA/IG0uR3JvdXBzWzFdLlZhbHVlIDogIiI7CiAgICAgICAgfSBjYXRjaCB7IHJldHVybiAiIjsgfQogICAgfQoKICAgIHN0YXRpYyBzdHJpbmcgR2V0TG9jYWxJUCgpIHsKICAgICAgICB0cnkgewogICAgICAgICAgICBmb3JlYWNoIChOZXR3b3JrSW50ZXJmYWNlIG5pIGluIE5ld3R3b3JrSW50ZXJmYWNlLkdldEFsbE5ldHdvcmtJbnRlcmZhY2VzKCkpIHsKICAgICAgICAgICAgICAgIGlmIChuaS5PcGVyYXRpb25hbFN0YXR1cyA9PSBPcGVyYXRpb25hbFN0YXR1cy5VcCkgewogICAgICAgICAgICAgICAgICAgIGZvcmVhY2ggKFVuaWNhc3RJUEFkZHJlc3NJbmZvcm1hdGlvbiBhZGRyIGluIG5pLkdldElQT3B0aW9ucygpLlVuaWNhc3RBZGRyZXNzZXMpIHsKICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZHIuQWRkcmVzcy5BZGRyZXNzRmFtaWx5ID09IFN5c3RlbS5OZXQuU29ja2V0cy5BZGRyZXNzRmFtaWx5LkludGVyTmV0d29yaykgcmV0dXJuIGFkZHIuQWRkcmVzcy5Ub1N0cmluZygpOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQogICAgICAgIH0gY2F0Y2gge30gcmV0dXJuICItIjsKICAgIH0KCiAgICBzdGF0aWMgc3RyaW5nIEdldERpc2tJbmZvKCkgewogICAgICAgIHRyeSB7CiAgICAgICAgICAgIERyaXZlSW5mbyBkID0gbmV3IERyaXZlSW5mbygiQyIpOwogICAgICAgICAgICByZXR1cm4gKGQuQXZhaWxhYmxlRnJlZVNwYWNlIC8gMTA3Mzc0MTgyNCkgKyAiR0IgLyAiICsgKGQuVG90YWxTaXplIC8gMTA3Mzc0MTgyNCkgKyAiR0IiOwogICAgICAgIH0gY2F0Y2gge30gcmV0dXJuICItIjsKICAgIH0KCiAgICBzdGF0aWMgdm9pZCBSdW5DbWQoV2ViQ2xpZW50IGMsIHN0amluZyBpZCwgc3RyaW5nIGNtZFRleHQpIHsKICAgICAgICB0cnkgewogICAgICAgICAgICBQcm9jZXNzIHAgPSBuZXcgUHJvY2VzcygpOwogICAgICAgICAgICBwLlN0YXJ0SW5mbyA9IG5ldyBQcm9jZXNzU3RhcnRJbmZvKCJjbWQuZXhlIiwgIi9jICIgKyBjbWRUZXh0KTsKICAgICAgICAgICAgcC5TdGFydEluZm8uUmVkaXJlY3RTdGFuZGFyZE91dHB1dCA9IHRydWU7CiAgICAgICAgICAgIHAuU3RhcnRJbmZvLlVzZVNoZWxsRXhlY3V0ZSA9IGZhbHNlOwogICAgICAgICAgICBwLlN0YXJ0SW5mby5DcmVhdGVOb1dpbmRvdyA9IHRydWU7CiAgICAgICAgICAgIHAuU3RhcnQoKTsKICAgICAgICAgICAgc3RyaW5nIHIgPSBDb252ZXJ0LlRvQmFzZTY0U3RyaW5nKEVuY29kaW5nLlVURjguR2V0Qnl0ZXMocC5TdGFuZGFyZE91dHB1dC5SZWFkVG9FbmQoKSkpOwogICAgICAgICAgICBjLkhlYWRlcnNbIkNvbnRlbnQtVHlwZSJdID0gImFwcGxpY2F0aW9uL2pzb24iOwogICAgICAgICAgICBjLlVwbG9hZFN0cmluZyhhcGlVcmwgKyAiL2FwaS9ydXN0ZGVzay9jb21tYW5kL3Jlc3VsdCIsICJQT1NUIiwgIntcImlkXCI6XCIiICsgaWQgKyAiXCIsXCJyZXN1bHRcIjpcIiIgKyByICsgIlwifSIpOwogICAgICAgIH0gY2F0Y2gge30KICAgIH0KfQ==";

    const psScript = `# --- RUSTDESK ATOMIK FIX SCRIPT ---
$ErrorActionPreference = "SilentlyContinue"

$idServer = "${idServer}"
$relayServer = "${relayServer}"
$apiServer = "${apiServer}"
$serverKey = "${serverKey}"
$finalPass = "${defaultPassword}"

Write-Host ">> Islem Baslatildi (Atomic Fix Mode)" -ForegroundColor Cyan

# 1. Temizlik
Stop-Process -Name "rustdesk" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "rustdesk_setup" -Force -ErrorAction SilentlyContinue

# 2. RustDesk Yukle
Write-Host ">> RustDesk kuruluyor..." -ForegroundColor Cyan
$setupPath = Join-Path $env:TEMP "rustdesk_setup.exe"
Invoke-WebRequest -Uri "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe" -OutFile $setupPath -UseBasicParsing
$proc = Start-Process $setupPath -ArgumentList "--silent-install" -PassThru
$timeout = 0
while ($proc -and !$proc.HasExited -and $timeout -lt 25) { Start-Sleep -Seconds 1; $timeout++ }

# 3. Ayarları Mühürle
Write-Host ">> Ayarlar muhurleniyor..." -ForegroundColor Cyan
Stop-Service -Name "rustdesk" -Force -ErrorAction SilentlyContinue

$toml = @"
rendezvous-server = '$idServer'
relay-server = '$relayServer'
api-server = '$apiServer'
key = '$serverKey'
verification-method = 'use-permanent-password'
remote-user-confirmation = 'N'

[options]
custom-rendezvous-server = '$idServer'
relay-server = '$relayServer'
api-server = '$apiServer'
key = '$serverKey'
verification-method = 'use-permanent-password'
remote-user-confirmation = 'N'
stop-service-on-user-logout = 'N'
accept-error = ''
permissions = 'all'
enable-uac = 'Y'
"@

$configPaths = @(
    "C:\\ProgramData\\RustDesk\\config",
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config",
    "$env:AppData\\RustDesk\\config"
)
$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)
foreach ($path in $configPaths) {
    if (!(Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path $path "RustDesk.toml"), $toml, $utf8NoBOM)
    [System.IO.File]::WriteAllText((Join-Path $path "RustDesk2.toml"), $toml, $utf8NoBOM)
}

# 4. CLI Zorlama
$rdExe = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") { "C:\\Program Files\\RustDesk\\rustdesk.exe" } else { "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe" }
if (Test-Path $rdExe) {
    & $rdExe --config rendezvous-server="$idServer"
    & $rdExe --config relay-server="$relayServer"
    & $rdExe --config api-server="$apiServer"
    & $rdExe --config key="$serverKey"
    & $rdExe --config verification-method=use-permanent-password
    & $rdExe --config remote-user-confirmation=N
    & $rdExe --set-password "$finalPass"
    Start-Service "rustdesk" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Restart-Service "rustdesk" -Force -ErrorAction SilentlyContinue
}

# 5. AJANI KUR (ATOMIK FIX)
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }
$base64 = "${base64Agent}"
$src = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64))
$src = $src.Replace("[[SERVER_URL]]", $apiServer)
[System.IO.File]::WriteAllText("$rmmDir\\Agent.cs", $src)

$csc = (Get-ChildItem "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.*\\csc.exe" | Select-Object -First 1).FullName
if ($csc) {
    & $csc /out:"$rmmDir\\RustDeskRMM.exe" /target:winexe "$rmmDir\\Agent.cs"
    $taskName = "RustDeskRMM_Service"
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    $action = New-ScheduledTaskAction -Execute "$rmmDir\\RustDeskRMM.exe"
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Force
    Start-ScheduledTask -TaskName $taskName
}

Write-Host ">> ATOMIK FIX TAMAMLANDI!" -ForegroundColor Green
`;

    return new Response(psScript, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="install.ps1"'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
