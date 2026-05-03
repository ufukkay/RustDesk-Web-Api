import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Süper Ajan Modu - Disk ve Envanter Bilgisi Fixlendi.
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
    
    // C# Süper Ajan Kodu (Hatasız ve Sağlam Disk Okuma)
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLklPOwp1c2luZyBTeXN0ZW0uVGV4dC5SZWd1bGFyRXhwcmVzc2lvbnM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwp1c2luZyBTeXN0ZW0uRGlhZ25vc3RpY3M7CnVzaW5nIFN5c3RlbS5OZXQuTmV0d29ya0luZm9ybWF0aW9uOwoKY2xhc3MgUHJvZmlyYW0gewogICAgc3RhdGljIHN0cmluZyBkZXZpY2VJZCA9ICIiOwogICAgc3RhdGljIHN0cmluZyBhcGlVcmwgPSAiW1tTRVJWRVJfVVJMXV0iOwoKICAgIHN0YXRpYyB2b2lkIE1haW4oc3RyaW5nIFtdIGFyZ3MpIHsKICAgICAgICBXZWJDbGllbnQgY2xpZW50ID0gbmV3IFdlYkNsaWVudCgpOwogICAgICAgIGNsaWVudC5FbmNvZGluZyA9IEVuY29kaW5nLlVURjg7CiAgICAgICAgCiAgICAgICAgd2hpbGUgKHRydWUpIHsKICAgICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgICAgIGlmIChzdHJpbmcuSXNOdWxsT3JFbXB0eShkZXZpY2VJZCkpIHsKICAgICAgICAgICAgICAgICAgICBzdHJpbmcgcDEgPSAiQzpcXFdpbmRvd3NcXFNlcnZpY2VQcm9maWxlc1xcTG9jYWxTZXJ2aWNlXFxBcHBEYXRhXFxSb2FtaW5nXFxSdXN0RGVza1xcY29uZmlnXFxSdXN0RGVzazIudG9tbCI7CiAgICAgICAgICAgICAgICAgICAgc3RyaW5nIHAyID0gIkM6XFxQcm9ncmFtRGF0YVxcUnVzdERlc2tcXGNvbmZpZ1xcUnVzdERlc2syLnRvbWwiOwogICAgICAgICAgICAgICAgICAgIGlmIChGaWxlLkV4aXN0cyhwMSkpIHsgZGV2aWNlSWQgPSBFeHRyYWN0SWQocDEpOyB9CiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoRmlsZS5FeGlzdHMocDIpKSB7IGRldmljZUlkID0gRXh0cmFjdElkKHAyKTsgfQogICAgICAgICAgICAgICAgICAgIGlmIChzdHJpbmcuSXNOdWxsT3JFbXB0eShkZXZpY2VJZCkpIGRldmljZUlkID0gRW52aXJvbm1lbnQuTWFjaGluZU5hbWU7CiAgICAgICAgICAgICAgICB9CgogICAgICAgICAgICAgICAgc3RyaW5nIGlwID0gR2V0SVAoKTsKICAgICAgICAgICAgICAgIHN0cmluZyBkaXNrID0gR2V0RGlzaygpOwogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICBjbGllbnQuSGVhZGVyc1tIdHRwUmVxdWVzdEhlYWRlci5Db250ZW50VHlwZV0gPSAiYXBwbGljYXRpb24vanNvbiI7CiAgICAgICAgICAgICAgICBzdHJpbmcgYm9keSA9ICJ7XCJpZFwiOlwiIiArIGRldmljZUlkICsgIlwiLFwiaG9zdG5hbWVcIjpcIiIgKyBFbnVpcm9ubWVudC5NY NoaW5lTmFtZSArICJcIixcIm9zXCI6XCJ3aW5kb3dzXCIsXCJpcFwiOlwiIiArIGlwICsgIlwiLFwiZGlza1wiOlwiIiArIGRpc2sgKyAiXCJ9IjsKICAgICAgICAgICAgICAgIHN0cmluZyByZXNwb25zZSA9IGNsaWVudC5VcGxvYWRTdHJpbmcoYXBpVXJsICsgIi9hcGkvaGVhcnRiZWF0IiwgIlBPU1QiLCBib2R5KTsKCiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuQ29udGFpbnMoXCJjb21tYW5kXCIpKSB7CiAgICAgICAgICAgICAgICAgICAgTWF0Y2ggbSA9IFJlZ2V4Lk1hdGNoKHJlc3BvbnNlLCBAIlwiY29tbWFuZFwiXHMqOlxzKlwiKC4qPylcIiIpOwogICAgICAgICAgICAgICAgICAgIGlmIChtLlN1Y2Nlc3MpIFJ1bkNtZChjbGllbnQsIGRldmljZUlkLCBtLkdyb3Vwc1sxXS5WYWx1ZSk7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0gY2F0Y2gge30KICAgICAgICAgICAgVGhyZWFkLlNsZWVwKDEwMDAwKTsKICAgICAgICB9CiAgICB9CgogICAgc3RhdGljIHN0cmluZyBFeHRyYWN0SWQoc3RyaW5nIHApIHsKICAgICAgICB0cnUgeyBzdHJpbmcgYyA9IEZpbGUuUmVhZEFsbFRleHQocCk7IE1hdGNoIG0gPSBSZWdleC5NYXRjaChjLCBAImlkXHMoKj8pPVxzKCk/JyhcZCspJyIpOyByZXR1cm4gbS5TdWNjZXNzID8gbS5Hcm91cHNbMl0uVmFsdWUgOiAiIjsgfSBjYXRjaCB7IHJldHVybiAiIjsgfQogICAgfQoKICAgIHN0YXRpYyBzdHJpbmcgR2V0SVAoKSB7CiAgICAgICAgdHJ5IHsKICAgICAgICAgICAgZm9yZWFjaCAoTmV0d29ya0ludGVyZmFjZSBuaSBpbiBOZXR3b3JrSW50ZXJmYWNlLkdldEFsbE5ldHdvcmtJbnRlcmZhY2VzKCkpIHsKICAgICAgICAgICAgICAgIGlmIChuaS5PcGVyYXRpb25hbFN0YXR1cyA9PSBPcGVyYXRpb25hbFN0YXR1cy5VcCkgewogICAgICAgICAgICAgICAgICAgIGZvcmVhY2ggKFVuaWNhc3RJUEFkZHJlc3NJbmZvcm1hdGlvbiBhZGRyIGluIG5pLkdldElQT3B0aW9ucygpLlVuaWNhc3RBZGRyZXNzZXMpIHsKICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZHIuQWRkcmVzcy5BZGRyZXNzRmFtaWx5ID09IFN5c3RlbS5OZXQuU29ja2V0cy5BZGRyZXNzRmFtaWx5LkludGVyTmV0d29yaykgcmV0dXJuIGFkZHIuQWRkcmVzcy5Ub1N0cmluZygpOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQogICAgICAgIH0gY2F0Y2gge30gcmV0dXJuICItIjsKICAgIH0KCiAgICBzdHJpbmcgc3RhdGljIEdldERpc2soKSB7CiAgICAgICAgdHJ5IHsgRHJpdmVJbmZvIGQgPSBuZXcgRHJpdmVJbmZvKCJDIik7IHJldHVybiAoZC5BdmFpbGFibGVGcmVlU3BhY2UgLyAxMDczNzQxODI0KSArICJHQiAvICIgKyAoZC5Ub3RhbFNpemUgLyAxMDczNzQxODI0KSArICJHQiI7IH0gY2F0Y2gge30gcmV0dXJuICItIjsKICAgIH0KCiAgICBzdGF0aWMgdm9pZCBSdW5DbWQoV2ViQ2xpZW50IGMsIHN0cmluZyBpZCwgc3RyaW5nIHR4dCkgewogICAgICAgIHRyeSB7CiAgICAgICAgICAgIFByb2Nlc3MgcCA9IG5ldyBQcm9jZXNzKCk7CiAgICAgICAgICAgIHAuU3RhcnRJbmZvID0gbmV3IFByb2Nlc3ZTdGFydEluZm8oImNtZC5leGUiLCAiL2MgIiArIHR4dCk7CiAgICAgICAgICAgIHAuU3RhcnRJbmZvLlJlZGlyZWN0U3RhbmRhcmRPdXRwdXQgPSB0cnVlOyBwLlN0YXJ0SW5mby5Vc2VTaGVsbEV4ZWN1dGUgPSBmYWxzZTsgcC5TdGFydEluZm8uQ3JlYXRlTm9XaW5kb3cgPSB0cnVlOwogICAgICAgICAgICBwLlN0YXJ0KCk7IHN0cmluZyByID0gQmFzZTY0RW5jb2RlKHAuU3RhbmRhcmRPdXRwdXQuUmVhZFRvRW5kKCkpOwogICAgICAgICAgICBjLkhlYWRlcnNbSHR0cFJlcXVlc3RIZWFkZXIuQ29udGVudFR5cGV0XSA9ICJhcHBsaWNhdGlvbi9qc29uIjsKICAgICAgICAgICAgYy5VcGxvYWRTdHJpbmcoYXBpVXJsICsgIi9hcGkvcnVzdGRlc2svY29tbWFuZC9yZXN1bHQiLCAiUE9TVCIsICJ7XCJpZFwiOlwiIiArIGlkICsgIlwiLFwicmVzdWx0XCI6XCIiICsgciArICJcIn0iKTsKICAgICAgICB9IGNhdGNoIHt9CiAgICB9CgogICAgc3RhdGljIHN0cmluZyBCYXNlNjRFbmNvZGUoc3RyaW5nIHQpIHsgcmV0dXJuIENvbnZlcnQuVG9CYXNlNjRTdHJpbmcoRW5jb2RpbmcuVVRGOC5HZXRCeXRlcyh0KSk7IH0KfQ==";

    const psScript = `# --- RUSTDESK DISK FIX SCRIPT ---
$ErrorActionPreference = "SilentlyContinue"

$idServer = "${idServer}"
$relayServer = "${relayServer}"
$apiServer = "${apiServer}"
$serverKey = "${serverKey}"
$finalPass = "${defaultPassword}"

Write-Host ">> Islem Baslatildi (Disk Fix Mode)" -ForegroundColor Cyan

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

# 5. SUPER AJANI KUR (DISK FIX)
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

Write-Host ">> DISK FIX TAMAMLANDI!" -ForegroundColor Green
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
