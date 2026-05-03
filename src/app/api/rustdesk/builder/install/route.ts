import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Sessiz ve otomatik kurulum scripti.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getSettings();
    
    const host = searchParams.get("host") || settings.host;
    const port = searchParams.get("port") || settings.port;
    const defaultPassword = settings.defaultPassword || "";
    
    // Sunucu anahtarını bul
    const keyPaths = [
      "/home/rd/rustdesk/id_ed25519.pub",
      "/var/lib/rustdesk-server/id_ed25519.pub",
      "/root/rustdesk/id_ed25519.pub",
      "./id_ed25519.pub"
    ];
    let serverKey = "YOK";
    for (const p of keyPaths) {
      if (fs.existsSync(p)) {
        serverKey = fs.readFileSync(p, "utf-8").trim();
        break;
      }
    }

    const fullServerUrl = `http://${host}:${port}`;

    // C# Agent Kodu (Base64) - Tam otomatik kayıt ve ID bulma
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLkRpYWdub3N0aWNzOwp1c2luZyBTeXN0ZW0uUnVudGltZS5JbnRlcm9wU2VydmljZXM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwp1c2luZyBTeXN0ZW0uTmV0Lk5ldHdvcmtJbmZvcm1hdGlvbjsKdXNpbmcgU3lzdGVtLklPOwp1c2luZyBTeXN0ZW0uVGV4dC5SZWd1bGFyRXhwcmVzc2lvbnM7CgpwdWJsaWMgY2xhc3MgUnVzdERlc2tBZ2VudCB7CiAgICBwdWJsaWMgc3RhdGljIHZvaWQgTWFpbigpIHsKICAgICAgICBzdHJpbmcgc2VydmljZVVybCA9ICJbW1NFUlZFUl9VUkxdXS9hcGkvaGVhcnRiZWF0IjsKICAgICAgICBzdHJpbmcgcmVzdWx0VXJsID0gIltbU0VSVkVSX1VSTF1dL2FwaS9ydXN0ZGVzay9jb21tYW5kL3Jlc3VsdCI7CiAgICAgICAgV2ViQ2xpZW50IGNsaWVudCA9IG5ldyBXZWJDbGllbnQoKTsKICAgICAgICBjbGllbnQuRW5jb2RpbmcgPSBFbmNvZGluZy5VVEY4OwogICAgICAgIAogICAgICAgIHdoaWxlICh0cnVlKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICBzdHJpbmcgZGV2aWNlSWQgPSAiIjsKICAgICAgICAgICAgICAgIHN0cmluZ1tdIHBhdGhzID0gbmV3IHN0cmluZ1tdIHsKICAgICAgICAgICAgICAgICAgICBAIkM6XFdpbmRvd3NcU2VydmljZVByb2ZpbGVzXExvY2FsU2VydmljZVxBcHBEYXRhXFJvYW1pbmdcUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrLnRvbWwiLAogICAgICAgICAgICAgICAgICAgIEAiQzpcUHJvZ3JhbURhdGFcUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrLnRvbWwiLAogICAgICAgICAgICAgICAgICAgIFBhdGguQ29tYmluZShFbnZpcm9ubWVudC5HZXRGb2xkZXJQYXRoKEVudmlyb25tZW50LlNwZWNpYWxGb2xkZXIuQXBwbGljYXRpb25EYXRhKSwgQCJSdXN0RGVza1xjb25maWdcUnVzdERlc2sudG9tbCIpCiAgICAgICAgICAgICAgICB9OwogICAgICAgICAgICAgICAgZm9yZWFjaCAodmFyIG5pIGluIHBhdGhzKSB7CiAgICAgICAgICAgICAgICAgICAgaWYgKEZpbGUuRXhpc3RzKG5pKSkgewogICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgYyA9IEZpbGUuUmVhZEFsbFRleHQobmkpOwogICAgICAgICAgICAgICAgICAgICAgICBNYXRjaCBtID0gUmVnZXguTWF0Y2goYywgQCJpZFxzKj1ccyonKFxkKyknIik7CiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtLlN1Y2Nlc3MpIHsgZGV2aWNlSWQgPSBtLkdyb3Vwc1sxXS5WYWx1ZTsgYnJlYWs7IH0KICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBpZiAoc3RyaW5nLklzTnVsbE9yRW1wdHkoZGV2aWNlSWQpKSBkZXZpY2VJZCA9IEVudmlyb25tZW50Lk1hY2hpbmVOYW1lOwogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICBEcml2ZUluZm8gZHYgPSBuZXcgRHJpdmVJbmZvKCJDIik7CiAgICAgICAgICAgICAgICBzdHJpbmcgZHNrID0gc3RyaW5nLkZvcm1hdCgiezA6TjF9IEdCIC8gezE6TjF9IEdCIiwgZHYuQXZhaWxhYmxlRnJlZVNwYWNlIC8gMTA3Mzc0MTgyNC4wLCBkdi5Ub3RhbFNpemUgLyAxMDczNzQxODI0LjApOwogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICBzdHJpbmcgYm9keSA9ICJ7IFwiaWRcIjpcIiIgKyBkZXZpY2VJZCArICJcIiwgXCJkaXNrXCI6XCIiICsgZHNrICsgICJcIiwgXCJob3N0bmFtZVwiOlwidSIgKyBFbnZpcm9ubWVudC5NYWNoaW5lTmFtZSArICJcIiwgXCJvc1wiOlwid2luZG93c1wiIH0iOwogICAgICAgICAgICAgICAgY2xpZW50LkhlYWRlcnNbSHR0cFJlcXVlc3RIZWFkZXIuQ29udGVudFR5cGVdID0gImFwcGxpY2F0aW9uL2pzb24iOwogICAgICAgICAgICAgICAgY2xpZW50LlVwbG9hZFN0cmluZyhzZXJ2aWNlVXJsLCAiUE9TVCIsIGJvZHkpOwogICAgICAgICAgICB9IGNhdGNoIHt9CiAgICAgICAgICAgIFRocmVhZC5TbGVlcCgxMDAwMCk7CiAgICAgICAgfQogICAgfQp9";

    const psScript = `# --- RUSTDESK SESSİZ KURULUM ---
$ErrorActionPreference = "SilentlyContinue"
$targetHost = "${host}"
$serverUrl = "${fullServerUrl}"
$serverKey = "${serverKey}"
$defPass = "${defaultPassword}"

Write-Host ">> Kurulum baslatildi..." -ForegroundColor Cyan

# 1. Klasorler
$dir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }

# 2. RustDesk Kurulumu
$rdUrl = "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe"
$rdPath = Join-Path $env:TEMP "rd.exe"
Invoke-WebRequest -Uri $rdUrl -OutFile $rdPath -UseBasicParsing
Start-Process $rdPath -ArgumentList "--silent-install" -Wait

# 3. Sunucu Ayarları
$toml = "id-server = '$targetHost'\`nrelay-server = '$targetHost'\`napi-server = 'http://$targetHost:3000'\`nkey = '$serverKey'"
Stop-Service "rustdesk" -ErrorAction SilentlyContinue
taskkill /F /IM RustDesk.exe /T 2>$null

$paths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config",
    "$env:AppData\\RustDesk\\config",
    "$env:ProgramData\\RustDesk\\config"
)
foreach ($p in $paths) {
    if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force }
    $toml | Set-Content -Path "$p\\RustDesk.toml" -Force
    $toml | Set-Content -Path "$p\\rustdesk.toml" -Force
}

if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") {
    Start-Process "C:\\Program Files\\RustDesk\\rustdesk.exe" -ArgumentList "--config", "$toml" -WindowStyle Hidden -Wait
    if ($defPass) {
        Start-Process "C:\\Program Files\\RustDesk\\rustdesk.exe" -ArgumentList "--set-password", "$defPass" -WindowStyle Hidden
    }
}
Start-Service "rustdesk" -ErrorAction SilentlyContinue

# 4. RMM Ajanı (Sessiz)
$base64 = "${base64Agent}"
$source = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64))
$source = $source.Replace("[[SERVER_URL]]", $serverUrl)
$source | Out-File -FilePath "$dir\\Agent.cs" -Encoding utf8 -Force

$csc = (Get-ChildItem "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.*\\csc.exe" | Select-Object -First 1).FullName
if ($csc) {
    & $csc /out:"$dir\\RustDeskRMM.exe" /target:winexe "$dir\\Agent.cs"
    $taskName = "RustDeskRMM_Service"
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    $action = New-ScheduledTaskAction -Execute "$dir\\RustDeskRMM.exe"
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
    Start-ScheduledTask -TaskName $taskName
}

Write-Host ">> KURULUM TAMAMLANDI." -ForegroundColor Green
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
