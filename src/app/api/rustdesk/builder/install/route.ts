import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Tam Kapsamlı, Hatasız Windows Kurulum Scripti.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getSettings();
    
    const host = searchParams.get("host") || settings.host;
    const port = searchParams.get("port") || settings.port;
    
    // Yeni eklenen detaylı ayarları al (yoksa host'u kullan)
    const idServer = settings.idServer || host;
    const relayServer = settings.relayServer || host;
    const apiServer = settings.apiServer || `http://${host}:${port}`;
    const defaultPassword = settings.defaultPassword || "";
    
    let serverKey = settings.serverKey || "YOK";
    
    // Eğer ayarlarda yoksa otomatik bulmaya çalış (Windows yollarına öncelik ver)
    if (serverKey === "YOK" || !serverKey) {
      const keyPaths = [
        "C:\\ProgramData\\RustDesk\\config\\id_ed25519.pub",
        "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\id_ed25519.pub",
        path.join(process.cwd(), "id_ed25519.pub"),
        "./id_ed25519.pub",
        "id_ed25519.pub"
      ];
      
      for (const p of keyPaths) {
        try {
          if (fs.existsSync(p)) {
            const foundKey = fs.readFileSync(p, "utf-8").trim();
            if (foundKey) {
              serverKey = foundKey;
              break;
            }
          }
        } catch (e) {}
      }
    }

    // C# Agent Kodu (Base64) - Stabil versiyon
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLkRpYWdub3N0aWNzOwp1c2luZyBTeXN0ZW0uUnVudGltZS5JbnRlcm9wU2VydmljZXM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwp1c2luZyBTeXN0ZW0uTmV0Lk5ldHdvcmtJbmZvcm1hdGlvbjsKdXNpbmcgU3lzdGVtLklPOwp1c2luZyBTeXN0ZW0uVGV4dC5SZWd1bGFyRXhwcmVzc2lvbnM7CgpwdWJsaWMgY2xhc3MgUnVzdERlc2tBZ2VudCB7CiAgICBwdWJsaWMgc3RhdGljIHZvaWQgTWFpbigpIHsKICAgICAgICBzdHJpbmcgc2VydmljZVVybCA9ICJbW1NFUlZFUl9VUkxdXS9hcGkvaGVhcnRiZWF0IjsKICAgICAgICBzdHJpbmcgcmVzdWx0VXJsID0gIltbU0VSVkVSX1VSTF1dL2FwaS9ydXN0ZGVzay9jb21tYW5kL3Jlc3VsdCI7CiAgICAgICAgV2ViQ2xpZW50IGNsaWVudCA9IG5ldyBXZWJDbGllbnQoKTsKICAgICAgICBjbGllbnQuRW5jb2RpbmcgPSBFbmNvZGluZy5VVEY4OwogICAgICAgIAogICAgICAgIHdoaWxlICh0cnVlKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICBzdHJpbmcgZGV2aWNlSWQgPSAiIjsKICAgICAgICAgICAgICAgIExpc3Q8c3RyaW5nPiBwYXRocyA9IG5ldyBMaXN0PHN0cmluZz4oKSB7CiAgICAgICAgICAgICAgICAgICAgQCJDOlxXaW5kb3dzXFNlcnZpY2VQcm9maWxlc1xMb2NhbFNlcnZpY2VcQXBwRGF0YVxSb2FtaW5nXFJ1c3REZXNrXGNvbmZpZ1xSdXN0RGVzazIudG9tbCIsCiAgICAgICAgICAgICAgICAgICAgQCJDOlxQcm9ncmFtRGF0YVxSdXN0RGVza1xjb25maWdcUnVzdERlc2syLnRvbWwiLAogICAgICAgICAgICAgICAgICAgIFBhdGguQ29tYmluZShFbnZpcm9ubWVudC5HZXRGb2xkZXJQYXRoKEVudmlyb25tZW50LlNwZWNpYWxGb2xkZXIuQXBwbGljYXRpb25EYXRhKSwgQCJSdXN0RGVza1xjb25maWdcUnVzdERlc2syLnRvbWwiKQogICAgICAgICAgICAgICAgfTsKICAgICAgICAgICAgICAgIGZvcmVhY2ggKHZhciBwdCBpbiBwYXRocykgewogICAgICAgICAgICAgICAgICAgIGlmIChGaWxlLkV4aXN0cyhwdCkpIHsKICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nIGMgPSBGaWxlLlJlYWRBbGxUZXh0KHB0KTsKICAgICAgICAgICAgICAgICAgICAgICAgTWF0Y2ggbSA9IFJlZ2V4Lk1hdGNoKGMsIEAiaWRccyo9XHMqJyhcZCspJyIpOwogICAgICAgICAgICAgICAgICAgICAgICBpZiAobS5TdWNjZXNzKSB7IGRldmljZUlkID0gbS5Hcm91cHNbMV0uVmFsdWU7IGJyZWFrOyB9CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgaWYgKHN0cmluZy5Jc051bGxPckVtcHR5KGRldmljZUlkKSkgZGV2aWNlSWQgPSBFbnZpcm9ubWVudC5NYWNoaW5lTmFtZTsKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgRHJpdmVJbmZvIGR2ID0gbmV3IERyaXZlSW5mbygiQyIpOwogICAgICAgICAgICAgICAgc3RyaW5nIGRzayA9IHN0cmluZy5Gb3JtYXQoInswOk4xfSBHQiAvIHsxOk4xfSBHQiIsIGR2LkF2YWlsYWJsZUZyZWVTcGFjZSAvIDEwNzM3NDE4MjQuMCwgZHYuVG9RhFNpemUgLyAxMDczNzQxODI0LjApOwogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICBzdHJpbmcgYm9keSA9ICJ7IFwiaWRcIjpcIiIgKyBkZXZpY2VJZCArICJcIiwgXCJkaXNrXCI6XCIiICsgZHNrICsgICJcIiwgXCJob3N0bmFtZVwiOlwidSIgKyBFbnZpcm9ubWVudC5NYWNoaW5lTmFtZSArICJcIiwgXCJvc1wiOlwid2luZG93c1wiIH0iOwogICAgICAgICAgICAgICAgY2xpZW50LkhlYWRlcnNbSHR0cFJlcXVlc3RIZWFkZXIuQ29udGVudFR5cGVdID0gImFwcGxpY2F0aW9uL2pzb24iOwogICAgICAgICAgICAgICAgY2xpZW50LlVwbG9hZFN0cmluZyhzZXJ2aWNlVXJsLCAiUE9TVCIsIGJvZHkpOwogICAgICAgICAgICB9IGNhdGNoIHt9CiAgICAgICAgICAgIFRocmVhZC5TbGVlcCgxMDAwMCk7CiAgICAgICAgfQogICAgfQp9";

    const psScript = `# --- RUSTDESK TAM OTOMATIK WINDOWS KURULUM ---
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = "SilentlyContinue"

$idServer = "${idServer}"
$relayServer = "${relayServer}"
$apiServer = "${apiServer}"
$serverKey = "${serverKey}"
$password = "${defaultPassword}"

Write-Host ">> Islem Baslatildi (ID Server: $idServer)" -ForegroundColor Cyan

# 1. Temizlik ve Hazirlik
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }

# 2. Sunucu Ayarları Hazırla
Write-Host ">> Ayarlar hazirlaniyor..." -ForegroundColor Cyan

$toml = @"
rendezvous-server = '$idServer'
rendezvous_server = '$idServer'
id-server = '$idServer'
id_server = '$idServer'
relay-server = '$relayServer'
relay_server = '$relayServer'
api-server = '$apiServer'
api_server = '$apiServer'
key = '$serverKey'
key_pk = '$serverKey'

[options]
custom-rendezvous-server = '$idServer'
custom_rendezvous_server = '$idServer'
relay-server = '$relayServer'
api-server = '$apiServer'
key = '$serverKey'
"@

Write-Host ">> TOML Icerigi:" -ForegroundColor Gray
Write-Host $toml

$configPaths = @(
    "C:\\ProgramData\\RustDesk\\config",
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config",
    "$env:AppData\\RustDesk\\config"
)

Get-ChildItem "C:\\Users" -ErrorAction SilentlyContinue | ForEach-Object {
    $configPaths += "$($_.FullName)\\AppData\\Roaming\\RustDesk\\config"
}

$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)

foreach ($path in $configPaths) {
    if (!(Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
    try {
        [System.IO.File]::WriteAllText((Join-Path $path "RustDesk.toml"), $toml, $utf8NoBOM)
        [System.IO.File]::WriteAllText((Join-Path $path "RustDesk2.toml"), $toml, $utf8NoBOM)
        [System.IO.File]::WriteAllText((Join-Path $path "rustdesk.toml"), $toml, $utf8NoBOM)
    } catch {
        Write-Host "!! HATA: $path klasorune yazilamadi." -ForegroundColor Red
    }
}

# 3. RustDesk Indir ve Kur (Filename Trick + Silent)
Write-Host ">> RustDesk indiriliyor..." -ForegroundColor Cyan
$url = "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe"
$setupName = "rustdesk-host=$($idServer)-key=$($serverKey).exe"
$setupPath = Join-Path $env:TEMP $setupName

if (Test-Path $setupPath) { Remove-Item $setupPath -Force }
Invoke-WebRequest -Uri $url -OutFile $setupPath -UseBasicParsing
Write-Host ">> Sessiz kurulum yapiliyor..." -ForegroundColor Cyan
Start-Process $setupPath -ArgumentList "--silent-install" -Wait

# 5. CLI ve Sifre Ayari
if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") {
    Start-Process "C:\\Program Files\\RustDesk\\rustdesk.exe" -ArgumentList "--config", "$toml" -WindowStyle Hidden -Wait
    if ($password) {
        Start-Process "C:\\Program Files\\RustDesk\\rustdesk.exe" -ArgumentList "--set-password", "$password" -WindowStyle Hidden
    }
}

Start-Service "rustdesk" -ErrorAction SilentlyContinue
Write-Host ">> RustDesk Ayarlari Tamam." -ForegroundColor Green

# 6. RMM Ajanini Kaydet ve Baslat
Write-Host ">> RMM Servisi yapılandırılıyor..." -ForegroundColor Cyan
$base64 = "${base64Agent}"
$src = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64))
$src = $src.Replace("[[SERVER_URL]]", $dashboardUrl)
$src | Out-File -FilePath "$rmmDir\\Agent.cs" -Encoding utf8 -Force

$csc = (Get-ChildItem "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.*\\csc.exe" | Select-Object -First 1).FullName
if ($csc) {
    & $csc /out:"$rmmDir\\RustDeskRMM.exe" /target:winexe "$rmmDir\\Agent.cs"
    
    $taskName = "RustDeskRMM_Service"
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    
    $action = New-ScheduledTaskAction -Execute "$rmmDir\\RustDeskRMM.exe"
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
    Start-ScheduledTask -TaskName $taskName
    Write-Host ">> RMM Aktif edildi." -ForegroundColor Green
}

Write-Host ">> KURULUM TAMAMLANDI!" -ForegroundColor Green
`;

    return new Response(psScript, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="install.ps1"'
      }
    });
  } catch (error: any) {
    console.error("Install Route Error:", error);
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
