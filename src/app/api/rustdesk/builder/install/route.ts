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

    // C# Agent Kodu (Base64) - Düzeltilmiş versiyon (u harfi ve değişken hatası giderildi)
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLkRpYWdub3N0aWNzOwp1c2luZyBTeXN0ZW0uUnVudGltZS5JbnRlcm9wU2VydmljZXM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwp1c2luZyBTeXN0ZW0uTmV0Lk5ldHdvcmtJbmZvcm1hdGlvbjsKdXNpbmcgU3lzdGVtLklPOwp1c2luZyBTeXN0ZW0uVGV4dC5SZWd1bGFyRXhwcmVzc2lvbnM7CgpwdWJsaWMgY2xhc3MgUnVzdERlc2tBZ2VudCB7CiAgICBwdWJsaWMgc3RhdGljIHZvaWQgTWFpbigpIHsKICAgICAgICBzdHJpbmcgc2VydmljZVVybCA9ICJbW1NFUlZFUl9VUkxdXS9hcGkvaGVhcnRiZWF0IjsKICAgICAgICBXZWJDbGllbnQgY2xpZW50ID0gbmV3IFdlYkNsaWVudCgpOwogICAgICAgIGNsaWVudC5FbmNvZGluZyA9IEVuY29kaW5nLlVURjg7CiAgICAgICAgCiAgICAgICAgd2hpbGUgKHRydWUpIHsKICAgICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgICAgIHN0cmluZyBkZXZpY2VJZCA9ICIiOwogICAgICAgICAgICAgICAgTGlzdDxzdHJpbmc+IHBhdGhzID0gbmV3IExpc3Q8c3RyaW5nPigpIHsKICAgICAgICAgICAgICAgICAgICBAIkM6XFdpbmRvd3NcU2VydmljZVByb2ZpbGVzXExvY2FsU2VydmljZVxBcHBEYXRhXFJvYW1pbmdcUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrLnRvbWwiLAogICAgICAgICAgICAgICAgICAgIEAiQzpcV2luZG93c1xTZXJ2aWNlUHJvZmlsZXNcTG9jYWxTZXJ2aWNlXEFwcERhdGFcUm9hbWluZ1xSdXN0RGVza1xjb25maWdcUnVzdERlc2syLnRvbWwiLAogICAgICAgICAgICAgICAgICAgIEAiQzpcUHJvZ3JhbURhdGFcUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrLnRvbWwiLAogICAgICAgICAgICAgICAgICAgIEAiQzpcUHJvZ3JhbURhdGFcUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrMi50b21sIiwKICAgICAgICAgICAgICAgICAgICBQYXRoLkNvbWJpbmUoRW52aXJvbm1lbnQuR2V0Rm9sZGVyUGF0aChFbnZpcm9ubWVudC5TcGVjaWFsRm9sZGVyLkFwcGxpY2F0aW9uRGF0YSksIEAiUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrMi50b21sIikKICAgICAgICAgICAgICAgIH07CiAgICAgICAgICAgICAgICBmb3JlYWNoICh2YXIgcHQgaW4gcGF0aHMpIHsKICAgICAgICAgICAgICAgICAgICBpZiAoRmlsZS5FeGlzdHMocHQpKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyBjID0gRmlsZS5SZWFkQWxsVGV4dChwdCk7CiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGNoIG0gPSBSZWdleC5NYXRjaChjLCBAImlkXHMqPVxzKicoXGQrKScuKj8iLCBSZWdleE9wdGlvbnMuU2luZ2xlbGluZSk7CiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtLlN1Y2Nlc3MpIHsgZGV2aWNlSWQgPSBtLkdyb3Vwc1sxXS5WYWx1ZTsgYnJlYWs7IH0KICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBpZiAoc3RyaW5nLklzTnVsbE9yRW1wdHkoZGV2aWNlSWQpKSBkZXZpY2VJZCA9IEVudmlyb25tZW50Lk1hY2hpbmVOYW1lOwogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICBEcml2ZUluZm8gZHYgPSBuZXcgRHJpdmVJbmZvKCJDIik7CiAgICAgICAgICAgICAgICBzdHJpbmcgZHNrID0gc3RyaW5nLkZvcm1hdCgiezA6TjF9IEdCIiwgZHYuQXZhaWxhYmxlRnJlZVNwYWNlIC8gMTA3Mzc0MTgyNC4wKTsKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgc3RyaW5nIGJvZHkgPSAieyBcImlkXCI6XCIiICsgZGV2aWNlSWQgKyBcIiwgXCJkaXNrXCI6XCIiICsgZHNrICsgIFwiIiwgXCJob3N0bmFtZVwiOlwiIiArIEVudmlyb25tZW50Lk1hY2hpbmVOYW1lICsgXCIsIFwib3NcIjpcIndpbmRvd3NcIiB9IjsKICAgICAgICAgICAgICAgIGNsaWVudC5IZWFkZXJzW0h0dHBSZXF1ZXN0SGVhZGVyLkNvbnRlbnRUeXBlXSA9ICJhcHBsaWNhdGlvbi9qc29uIjsKICAgICAgICAgICAgICAgIGNsaWVudC5VcGxvYWRTdHJpbmcoc2VydmljZVVybCwgIlBPU1QiLCBib2R5KTsKICAgICAgICAgICAgfSBjYXRjaCB7fQogICAgICAgICAgICBUaHJlYWQuU2xlZXAoMTAwMDApOwogICAgICAgIH0KICAgIH0KfQ==";

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

# 6. RMM Ajanini Kaydet ve Baslat
Write-Host ">> RMM Servisi yapılandırılıyor..." -ForegroundColor Cyan
$base64 = "${base64Agent}"
$src = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64))
$src = $src.Replace("[[SERVER_URL]]", $apiServer)
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
