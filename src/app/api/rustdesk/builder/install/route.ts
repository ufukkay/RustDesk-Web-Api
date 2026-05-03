import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Kesin Çözüm - Kurulum Sonrası Ayar Mühürleme Modu.
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
    
    // C# Agent Kodu
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLklPOwp1c2luZyBTeXN0ZW0uVGV4dC5SZWd1bGFyRXhwcmVzc2lvbnM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwp1c2luZyBTeXN0ZW0uRGlhZ25vc3RpY3M7CgpjbGFzcyBQcm9ncmFtIHsKICAgIHN0YXRpYyBzdHJpbmcgZGV2aWNlSWQgPSAiIjsKICAgIHN0YXRpYyBzdHJpbmcgYXBpVXJsID0gIltbU0VSVkVSX1VSTF1dIjsKCiAgICBzdGF0aWMgdm9pZCBNYWluKHN0cmluZyBbXSBhcmdzKSB7CiAgICAgICAgV2ViQ2xpZW50IGNsaWVudCA9IG5ldyBXZWJDbGllbnQoKTsKICAgICAgICBjbGllbnQuRW5jb2RpbmcgPSBFbmNvZGluZy5VVEY4OwogICAgICAgIAogICAgICAgIHdoaWxlICh0cnVlKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICBpZiAoc3RyaW5nLklzTnVsbE9yRW1wdHkoZGV2aWNlSWQpKSB7CiAgICAgICAgICAgICAgICAgICAgc3RyaW5nIFtdIHBhdGhzID0geyBAIkM6XFdpbmRvd3NcU2VydmljZVByb2ZpbGVzXExvY2FsU2VydmljZVxBcHBEYXRhXFJvYW1pbmdcUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrMi50b21sIiwgQCJDOlxQcm9ncmFtRGF0YVxSdXN0RGVza1xjb25maWdcUnVzdERlc2syLnRvbWwiIH07CiAgICAgICAgICAgICAgICAgICAgZm9yZWFjaCAoc3RyaW5nIHB0IGluIHBhdGhzKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChGaWxlLkV4aXN0cyhwdCkpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyBjID0gRmlsZS5SZWFkQWxsVGV4dChwdCk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRjaCBtID0gUmVnZXguTWF0Y2goYywgQCJpZFxzKj1ccyonKFxkKyknIik7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobS5TdWNjZXNzKSB7IGRldmljZUlkID0gbS5Hcm91cHNbMV0uVmFsdWU7IGJyZWFrOyB9CiAgICAgICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmluZy5Jc051bGxPckVtcHR5KGRldmljZUlkKSkgZGV2aWNlSWQgPSBFbnVpcm9ubWVudC5NYWNoaW5lTmFtZTsKICAgICAgICAgICAgICAgIH0KCiAgICAgICAgICAgICAgICBjbGllbnQuSGVhZGVyc1tIdHRwUmVxdWVzdEhlYWRlci5Db250ZW50VHlwZV0gPSAiYXBwbGljYXRpb24vanNvbiI7CiAgICAgICAgICAgICAgICBzdHJpbmcgYm9keSA9ICJ7IFwiaWRcIjpcIicgKyBkZXZpY2VJZCArICJcIiwgXCJob3N0bmFtZVwiOlwiIiArIEVudmlyb25tZW50Lk1hY2hpbmVOYW1lICsgXCIsIFwib3NcIjpcIndpbmRvd3NcIiB9IjsKICAgICAgICAgICAgICAgIGNsaWVudC5VcGxvYWRTdHJpbmcoYXBpVXJsICsgIi9hcGkvaGVhcnRiZWF0IiwgIlBPU1QiLCBib2R5KTsKICAgICAgICAgICAgfSBjYXRjaCB7fQogICAgICAgICAgICBUaHJlYWQuU2xlZXAoMTAwMDApOwogICAgICAgIH0KICAgIH0KfQ==";

    const psScript = `# --- RUSTDESK KESIN COZUM SCRIPT ---
$ErrorActionPreference = "SilentlyContinue"

$idServer = "${idServer}"
$relayServer = "${relayServer}"
$apiServer = "${apiServer}"
$serverKey = "${serverKey}"
$finalPass = "${defaultPassword}"

Write-Host ">> Islem Baslatildi (Final Fix Mode)" -ForegroundColor Cyan

# 1. RustDesk Indir ve Yukle (Sessiz)
Write-Host ">> RustDesk indiriliyor ve kuruluyor..." -ForegroundColor Cyan
$setupPath = Join-Path $env:TEMP "rustdesk_setup.exe"
Invoke-WebRequest -Uri "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe" -OutFile $setupPath -UseBasicParsing
Start-Process $setupPath -ArgumentList "--silent-install" -Wait

# 2. KURULUM SONRASI AYARLARI MUHURLE
Write-Host ">> Ayarlar muhurleniyor (Lutfen bekleyin)..." -ForegroundColor Cyan
Stop-Process -Name "rustdesk" -Force -ErrorAction SilentlyContinue
Stop-Service -Name "rustdesk" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# TOML Yapılandırması (Tum Onaylari Kapatan Agresif Ayarlar)
$toml = @"
rendezvous-server = '$idServer'
relay-server = '$relayServer'
api-server = '$apiServer'
key = '$serverKey'
verification-method = 'use-permanent-password'
remote-user-confirmation = 'N'
permissions = 'all'

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
enable-audio = 'Y'
enable-video = 'Y'
enable-clipboard = 'Y'
enable-file-transfer = 'Y'
enable-keyboard = 'Y'
enable-mouse = 'Y'
enable-remote-restart = 'Y'
enable-uac = 'Y'
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
    [System.IO.File]::WriteAllText((Join-Path $path "RustDesk.toml"), $toml, $utf8NoBOM)
    [System.IO.File]::WriteAllText((Join-Path $path "RustDesk2.toml"), $toml, $utf8NoBOM)
}

# 3. Sifre Atama ve Servis Baslatma
$rdExe = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") { "C:\\Program Files\\RustDesk\\rustdesk.exe" } else { "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe" }

if (Test-Path $rdExe) {
    & $rdExe --set-password "$finalPass"
    Start-Service "rustdesk" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    & $rdExe --config verification-method=use-permanent-password
    & $rdExe --config remote-user-confirmation=N
    & $rdExe --set-password "$finalPass"
    Restart-Service "rustdesk" -Force -ErrorAction SilentlyContinue
}

# 4. RMM Ajanini Kur
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }
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
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Force
    Start-ScheduledTask -TaskName $taskName
}

Write-Host ">> TAMAMLANDI! Artik onaysiz giris yapabilirsiniz." -ForegroundColor Green
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
