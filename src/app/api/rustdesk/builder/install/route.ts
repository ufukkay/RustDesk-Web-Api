import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Ajan Tamiri - Eski C# Derleyici Uyumluluk Modu.
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
    
    // C# Agent Kodu (Eski derleyici dostu - Slash karakterleri düzeltildi)
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLklPOwp1c2luZyBTeXN0ZW0uVGV4dC5SZWd1bGFyRXhwcmVzc2lvbnM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwp1c2luZyBTeXN0ZW0uRGlhZ25vc3RpY3M7CgpjbGFzcyBQcm9ncmFtIHsKICAgIHN0YXRpYyBzdHJpbmcgZGV2aWNlSWQgPSAiIjsKICAgIHN0YXRpYyBzdHJpbmcgYXBpVXJsID0gIltbU0VSVkVSX1VSTF1dIjsKCiAgICBzdGF0aWMgdm9pZCBNYWluKHN0cmluZyBbXSBhcmdzKSB7CiAgICAgICAgV2ViQ2xpZW50IGNsaWVudCA9IG5ldyBXZWJDbGllbnQoKTsKICAgICAgICBjbGllbnQuRW5jb2RpbmcgPSBFbmNvZGluZy5VVEY4OwogICAgICAgIAogICAgICAgIHdoaWxlICh0cnVlKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICBpZiAoc3RyaW5nLklzTnVsbE9yRW1wdHkoZGV2aWNlSWQpKSB7CiAgICAgICAgICAgICAgICAgICAgc3RyaW5nIHBhdGgxID0gIkM6XFxXaW5kb3dzXFxTZXJ2aWNlUHJvZmlsZXNcXExvY2FsU2VydmljZVxcQXBwRGF0YVxcUm9hbWluZ1xcUnVzdERlc2tcXGNvbmZpZ1xcUnVzdERlc2syLnRvbWwiOwogICAgICAgICAgICAgICAgICAgIHN0cmluZyBwYXRoMiA9ICJDOlxcUHJvZ3JhbURhdGFcXFJ1c3REZXNrXFxjb25maWdcXFJ1c3REZXNrMi50b21sIjsKICAgICAgICAgICAgICAgICAgICBpZiAoRmlsZS5FeGlzdHMocGF0aDEpKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyBjID0gRmlsZS5SZWFkQWxsVGV4dChwYXRoMSk7CiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGNoIG0gPSBSZWdleC5NYXRjaChjLCBAImlkXHMoKj8pPVxzKCk/JyhcZCspJyIpOwogICAgICAgICAgICAgICAgICAgICAgICBpZiAobS5TdWNjZXNzKSBkZXZpY2VJZCA9IG0uR3JvdXBzWzJdLlZhbHVlOwogICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoRmlsZS5FeGlzdHMocGF0aDIpKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyBjID0gRmlsZS5SZWFkQWxsVGV4dChwYXRoMik7CiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGNoIG0gPSBSZWdleC5NYXRjaChjLCBAImlkXHMoKj8pPVxzKCk/JyhcZCspJyIpOwogICAgICAgICAgICAgICAgICAgICAgICBpZiAobS5TdWNjZXNzKSBkZXZpY2VJZCA9IG0uR3JvdXBzWzJdLlZhbHVlOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICBpZiAoc3RyaW5nLklzTnVsbE9yRW1wdHkoZGV2aWNlSWQpKSBkZXZpY2VJZCA9IEVudmlyb25tZW50Lk1hY2hpbmVOYW1lOwogICAgICAgICAgICAgICAgfQoKICAgICAgICAgICAgICAgIGNsaWVudC5IZWFkZXJzW0h0dHBSZXF1ZXN0SGVhZGVyLkNvbnRlbnRUeXBlXSA9ICJhcHBsaWNhdGlvbi9qc29uIjsKICAgICAgICAgICAgICAgIHN0cmluZyBib2R5ID0gIntcImlkXCI6XCIiICsgZGV2aWNlSWQgKyAiXCIsXCJob3N0bmFtZVwiOlwiIiArIEVudmlyb25tZW50Lk1hY2hpbmVOYW1lICsgIlwiLFwib3NcIjpcIndpbmRvd3NcIn0iOwogICAgICAgICAgICAgICAgY2xpZW50LlVwbG9hZFN0cmluZyhhcGlVcmwgKyAiL2FwaS9oZWFydGJlYXQiLCAiUE9TVCIsIGJvZHkpOwogICAgICAgICAgICB9IGNhdGNoIHt9CiAgICAgICAgICAgIFRocmVhZC5TbGVlcCgxMDAwMCk7CiAgICAgICAgfQogICAgfQp9";

    const psScript = `# --- RUSTDESK AJAN TAMIRI SCRIPT ---
$ErrorActionPreference = "SilentlyContinue"

$idServer = "${idServer}"
$relayServer = "${relayServer}"
$apiServer = "${apiServer}"
$serverKey = "${serverKey}"
$finalPass = "${defaultPassword}"

Write-Host ">> Islem Baslatildi (Agent Repair Mode)" -ForegroundColor Cyan

# 1. Temizlik
Stop-Process -Name "rustdesk" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "rustdesk_setup" -Force -ErrorAction SilentlyContinue
$configPaths = @(
    "C:\\ProgramData\\RustDesk\\config",
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config",
    "$env:AppData\\RustDesk\\config"
)
foreach ($path in $configPaths) { if (!(Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null } }

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

$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)
foreach ($path in $configPaths) {
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

# 5. RMM Ajanini Kur (TAMIR EDILDI)
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }
$base64 = "${base64Agent}"
$src = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64))
$src = $src.Replace("[[SERVER_URL]]", $apiServer)
# ASCII formatında yazarak karakter hatasını önlüyoruz
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

Write-Host ">> KURULUM VE AJAN TAMAMLANDI!" -ForegroundColor Green
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
