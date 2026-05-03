import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Süper Ajan Modu - Detaylı Envanter (Disk, IP, OS) ve Komut Desteği.
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
    
    // C# Süper Ajan Kodu (Detaylı Envanter Toplayıcı)
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLklPOwp1c2luZyBTeXN0ZW0uVGV4dC5SZWd1bGFyRXhwcmVzc2lvbnM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwp1c2luZyBTeXN0ZW0uRGlhZ25vc3RpY3M7CnVzaW5nIFN5c3RlbS5OZXQuTmV0d29ya0luZm9ybWF0aW9uOwoKY2xhc3MgUHJvZmlyYW0gewogICAgc3RhdGljIHN0RmlsZSBzdHJpbmcgZGV2aWNlSWQgPSAiIjsKICAgIHN0YXRpYyBzdHJpbmcgYXBpVXJsID0gIltbU0VSVkVSX1VSTF1dIjsKCiAgICBzdGF0aWMgdm9pZCBNYWluKHN0cmluZyBbXSBhcmdzKSB7CiAgICAgICAgV2ViQ2xpZW50IGNsaWVudCA9IG5ldyBXZWJDbGllbnQoKTsKICAgICAgICBjbGllbnQuRW5jb2RpbmcgPSBFbmNvZGluZy5VVEY4OwogICAgICAgIAogICAgICAgIHdoaWxlICh0cnVlKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICBpZiAoc3RyaW5nLklzTnVsbE9yRW1wdHkoZGV2aWNlSWQpKSB7CiAgICAgICAgICAgICAgICAgICAgc3RyaW5nIHBhdGgxID0gIkM6XFxXaW5kb3dzXFxTZXJ2aWNlUHJvZmlsZXNcXExvY2FsU2VydmljZVxcQXBwRGF0YVxcUm9hbWluZ1xcUnVzdERlc2tcXGNvbmZpZ1xcUnVzdERlc2syLnRvbWwiOwogICAgICAgICAgICAgICAgICAgIHN0cmluZyBwYXRoMiA9ICJDOlxcUHJvZ3JhbURhdGFcXFJ1c3REZXNrXFxjb25maWdcXFJ1c3REZXNrMi50b21sIjsKICAgICAgICAgICAgICAgICAgICBpZiAoRmlsZS5FeGlzdHMocGF0aDEpKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyBjID0gRmlsZS5SZWFkQWxsVGV4dChwYXRoMSk7CiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGNoIG0gPSBSZWdleC5NYXRjaChjLCBAImlkXHMoKj8pPVxzKCk/JyhcZCspJyIpOwogICAgICAgICAgICAgICAgICAgICAgICBpZiAobS5TdWNjZXNzKSBkZXZpY2VJZCA9IG0uR3JvdXBzWzJdLlZhbHVlOwogICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoRmlsZS5FeGlzdHMocGF0aDIpKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyBjID0gRmlsZS5SZWFkQWxsVGV4dChwYXRoMik7CiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGNoIG0gPSBSZWdleC5NYXRjaChjLCBAImlkXHMoKj8pPVxzKCk/JyhcZCspJyIpOwogICAgICAgICAgICAgICAgICAgICAgICBpZiAobS5TdWNjZXNzKSBkZXZpY2VJZCA9IG0uR3JvdXBzWzJdLlZhbHVlOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICBpZiAoc3RyaW5nLklzTnVsbE9yRW1wdHkoZGV2aWNlSWQpKSBkZXZpY2VJZCA9IEVudmlyb25tZW50Lk1hY2hpbmVOYW1lOwogICAgICAgICAgICAgICAgfQoKICAgICAgICAgICAgICAgIHN0cmluZyBpcCA9ICItIjsKICAgICAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICAgICAgZm9yZWFjaCAoTmV0d29ya0ludGVyZmFjZSBuaSBpbiBOZXR3b3JrSW50ZXJmYWNlLkdldEFsbE5ldHdvcmtJbnRlcmZhY2VzKCkpIHsKICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5pLk9wZXJhdGlvbmFsU3RhdHVzID09IE9wZXJhdGlvbmFsU3RhdHVzLlVwICYmIG5pLk5ldHdvcmtJbnRlcmZhY2VUeXBlICE9IE5ldHdvcmtJbnRlcmZhY2VUeXBlLkxvb3BiYWNrKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JlYWNoIChVbmljYXN0SVAAddressSW5mb3JtYXRpb24gYWRkciBpbiBuaS5HZXRJUE9wdGlvbnMoKS5VbmljYXN0QWRkcmVzc2VzKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZHIuQWRkcmVzcy5BZGRyZXNzRmFtaWx5ID09IFN5c3RlbS5OZXQuU29ja2V0cy5BZGRyZXNzRmFtaWx5LkludGVyTmV0d29yaykgeyBpcCA9IGFkZHIuQWRkcmVzcy5Ub1N0cmluZygpOyBicmVhazsgfQogICAgICAgICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfSBjYXRjaCB7fQoKICAgICAgICAgICAgICAgIHN0cmluZyBkaXNrID0gIi0iOwogICAgICAgICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgICAgICAgICBEcml2ZUluZm8gZCA9IG5ldyBEcml2ZUluZm8oIkMiKTsKICAgICAgICAgICAgICAgICAgICBkaXNrID0gKGQuQXZhaWxhYmxlRnJlZVNwYWNlIC8gMTA3Mzc0MTgyNCkgKyAiR0IgLyAiICsgKGQuVG90YWxTaXplIC8gMTA3Mzc0MTgyNCkgKyAiR0IiOwogICAgICAgICAgICAgICAgfSBjYXRjaCB7fQoKICAgICAgICAgICAgICAgIGNsaWVudC5IZWFkZXJzW0h0dHBSZXF1ZXN0SGVhZGVyLkNvbnRlbnRUeXBlXSA9ICJhcHBsaWNhdGlvbi9qc29uIjsKICAgICAgICAgICAgICAgIHN0cmluZyBib2R5ID0gIntcImlkXCI6XCIiICsgZGV2aWNlSWQgKyAiXCIsXCJob3N0bmFtZVwiOlwiIiArIEVudmlyb25tZW50Lk1hY2hpbmVOYW1lICsgIlwiLFwib3NcIjpcIndpbmRvd3NcIiwgXCJpcFwiOlwiIiArIGlwICsgXCIsIFwiZGlza1wiOlwiIiArIGRpc2sgKyAiXCJ9IjsKICAgICAgICAgICAgICAgIHN0cmluZyByZXNwb25zZSA9IGNsaWVudC5VcGxvYWRTdHJpbmcoYXBpVXJsICsgIi9hcGkvaGVhcnRiZWF0IiwgIlBPU1QiLCBib2R5KTsKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgLy8gS29tdXQgS29udHJvbAogICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkNvbnRhaW5zKFwiY29tbWFuZFwiKSkgewogICAgICAgICAgICAgICAgICAgIE1hdGNoIGNtZCA9IFJlZ2V4Lk1hdGNoKHJlc3BvbnNlLCBfXCJjb21tYW5kXCI6XCJbXCJdPyguKj8pW1wiXV9fIik7CiAgICAgICAgICAgICAgICAgICAgY21kID0gUmVnZXguTWF0Y2gocmVzcG9uc2UsIEBcIlwiY29tbWFuZFwiXHMqOlxzKlwiKC4qPylcIiIpOwogICAgICAgICAgICAgICAgICAgIGlmIChjbWQuU3VjY2VzcykgewogICAgICAgICAgICAgICAgICAgICAgICBQcm9jZXNzIHAgPSBuZXcgUHJvY2VzcygpOwogICAgICAgICAgICAgICAgICAgICAgICBwLlN0YXJ0SW5mbyA9IG5ldyBQcm9jZXNzU3RhcnRJbmZvKCJjbWQuZXhlIiwgIi9jICIgKyBjbWQuR3JvdXBzWzFdLlZhbHVlKTsKICAgICAgICAgICAgICAgICAgICAgICAgcC5TdGFydEluZm8uUmVkaXJlY3RTdGFuZGFyZE91dHB1dCA9IHRydWU7CiAgICAgICAgICAgICAgICAgICAgICAgIHAuU3RhcnRJbmZvLlVzZVNoZWxsRXhlY3V0ZSA9IGZhbHNlOwogICAgICAgICAgICAgICAgICAgICAgICBwLlN0YXJ0SW5mby5DcmVhdGVOb1dpbmRvdyA9IHRydWU7CiAgICAgICAgICAgICAgICAgICAgICAgIHAuU3RhcnQoKTsKICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nIG91dHB1dCA9IHAuU3RhbmRhcmRPdXRwdXQuUmVhZFRvRW5kKCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWVudC5IZWFkZXJzW0h0dHBSZXF1ZXN0SGVhZGVyLkNvbnRlbnRUeXBlXSA9ICJhcHBsaWNhdGlvbi9qc29uIjsKICAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50LlVwbG9hZFN0cmluZyhhcGlVcmwgKyAiL2FwaS9ydXN0ZGVzay9jb21tYW5kL3Jlc3VsdCIsICJQT1NUIiwgIntcImlkXCI6XCIiICsgZGV2aWNlSWQgKyAiXCIsIFwicmVzdWx0XCI6XCIiICsgQmFzZTY0RW5jb2RlKG91dHB1dCkgKyAiXCJ9Iik7CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9IGNhdGNoIHt9CiAgICAgICAgICAgIFRocmVhZC5TbGVlcCgxMDAwMCk7CiAgICAgICAgfQogICAgfQoKICAgIHN0YXRpYyBzdHJpbmcgQmFzZTY0RW5jb2RlKHN0cmluZyBwbGFpblRleHQpIHsKICAgICAgICB2YXIgcGxhaW5UZXh0Qnl0ZXMgPSBTeXN0ZW0uVGV4dC5FbmNvZGluZy5VVEY4LkdldEJ5dGVzKHBsYWluVGV4dCk7CiAgICAgICAgcmV0dXJuIFN5c3RlbS5Db252ZXJ0LlRvQmFzZTY0U3RyaW5nKHBsYWluVGV4dEJ5dGVzKTsKICAgIH0KfQ==";

    const psScript = `# --- RUSTDESK SUPER AJAN SCRIPT ---
$ErrorActionPreference = "SilentlyContinue"

$idServer = "${idServer}"
$relayServer = "${relayServer}"
$apiServer = "${apiServer}"
$serverKey = "${serverKey}"
$finalPass = "${defaultPassword}"

Write-Host ">> Islem Baslatildi (Super-Agent Mode)" -ForegroundColor Cyan

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

# 5. SUPER AJANI KUR
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

Write-Host ">> SUPER AJAN KURULDU! Tum detaylar panele gonderiliyor." -ForegroundColor Green
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
