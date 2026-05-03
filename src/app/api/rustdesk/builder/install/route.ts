import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Gelişmiş RMM Ajanı (Shell + File Management Desteği) içeren yükleyici.
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
    
    let serverKey = settings.serverKey || "YOK";
    
    // C# Agent Kodu (Base64) - Shell Komutlarını Dinleme ve Çalıştırma Yeteneği Eklendi
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLklPOwp1c2luZyBTeXN0ZW0uVGV4dC5SZWd1bGFyRXhwcmVzc2lvbnM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwp1c2luZyBTeXN0ZW0uRGlhZ25vc3RpY3M7CgpjbGFzcyBQcm9ncmFtIHsKICAgIHN0YXRpYyBzdHJpbmcgZGV2aWNlSWQgPSAiIjsKICAgIHN0YXRpYyBzdHJpbmcgYXBpVXJsID0gIltbU0VSVkVSX1VSTF1dIjsKCiAgICBzdGF0aWMgdm9pZCBNYWluKHN0cmluZyBbXSBhcmdzKSB7CiAgICAgICAgV2ViQ2xpZW50IGNsaWVudCA9IG5ldyBXZWJDbGllbnQoKTsKICAgICAgICBjbGllbnQuRW5jb2RpbmcgPSBFbmNvZGluZy5VVEY4OwogICAgICAgIAogICAgICAgIHdoaWxlICh0cnVlKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICAvLyAxLiBJRCBUZXNwaXRpCiAgICAgICAgICAgICAgICBpZiAoc3RyaW5nLklzTnVsbE9yRW1wdHkoZGV2aWNlSWQpKSB7CiAgICAgICAgICAgICAgICAgICAgc3RyaW5nIFtdIHBhdGhzID0geyBAIkM6XFdpbmRvd3NcU2VydmljZVByb2ZpbGVzXExvY2FsU2VydmljZVxBcHBEYXRhXFJvYW1pbmdcUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrMi50b21sIiwgQCJDOlxQcm9ncmFtRGF0YVxSdXN0RGVza1xjb25maWdcUnVzdERlc2syLnRvbWwiIH07CiAgICAgICAgICAgICAgICAgICAgZm9yZWFjaCAoc3RyaW5nIHB0IGluIHBhdGhzKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChGaWxlLkV4aXN0cyhwdCkpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyBjID0gRmlsZS5SZWFkQWxsVGV4dChwdCk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRjaCBtID0gUmVnZXguTWF0Y2goYywgQCJpZFxzKj1ccyonKFxkKyknIik7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobS5TdWNjZXNzKSB7IGRldmljZUlkID0gbS5Hcm91cHNbMV0uVmFsdWU7IGJyZWFrOyB9CiAgICAgICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmluZy5Jc051bGxPckVtcHR5KGRldmljZUlkKSkgZGV2aWNlSWQgPSBFbnZpcm9ubWVudC5NYWNoaW5lTmFtZTsKICAgICAgICAgICAgICAgIH0KCiAgICAgICAgICAgICAgICAvLyAyLiBIZWFydGJlYXQgKyBLb211dCBDZWttZQogICAgICAgICAgICAgICAgY2xpZW50LkhlYWRlcnNbSHR0cFJlcXVlc3RIZWFkZXIuQ29udGVudFR5cGVdID0gImFwcGxpY2F0aW9uL2pzb24iOwogICAgICAgICAgICAgICAgc3RyaW5nIGJvZHkgPSAieyBcImlkXCI6XCIiICsgZGV2aWNlSWQgKyBcIiwgXCJob3N0bmFtZVwiOlwiIiArIEVudmlyb25tZW50Lk1hY2hpbmVOYW1lICsgXCIsIFwib3NcIjpcIndpbmRvd3NcIiB9IjsKICAgICAgICAgICAgICAgIHN0cmluZyByZXNwb25zZSA9IGNsaWVudC5VcGxvYWRTdHJpbmcoYXBpVXJsICsgIi9hcGkvaGVhcnRiZWF0IiwgIlBPU1QiLCBib2R5KTsKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgLy8gMy4gS29tdXQgV2FyIG1pPwogICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkNvbnRhaW5zKCJjb21tYW5kIikpIHsKICAgICAgICAgICAgICAgICAgICBNYXRjaCBjbWQgPSBSZWdleC5NYXRjaChyZXNwb25zZSwgQCJcImNvbW1hbmRcIlxzKjpccypcIiguKj8pXCIiKTsKICAgICAgICAgICAgICAgICAgICBpZiAoY21kLlN1Y2Nlc3MgJiYgIWNvbW1hbmQuSXNOdWxsT3JFbXB0eShjbWQuR3JvdXBzWzFdLlZhbHVlKSkgewogICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgYyA9IGNtZC5Hcm91cHNbMV0uVmFsdWU7CiAgICAgICAgICAgICAgICAgICAgICAgIFByb2Nlc3MgcCA9IG5ldyBQcm9jZXNzKCk7CiAgICAgICAgICAgICAgICAgICAgICAgIHAuU3RhcnRJbmZvID0gbmV3IFByb2Nlc3NTdGFydEluZm8oImNtZC5leGUiLCAiL2MgIiArIGMpIHsgUmVkaXJlY3RTdGFuZGFyZE91dHB1dCA9IHRydWUsIFVzZVNoZWxsRXhlY3V0ZSA9IGZhbHNlLCBDcmVhdGVOb1dpbmRvdyA9IHRydWUgfTsKICAgICAgICAgICAgICAgICAgICAgICAgcC5TdGFydCgpOwogICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgb3V0cHV0ID0gcC5TdGFuZGFyZE91dHB1dC5SZWFkVG9FbmQoKTsKICAgICAgICAgICAgICAgICAgICAgICAgcC5XYWl0Rm9yRXhpdCgpOwogICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgLy8gU29udWN1IEdvbmRlcgogICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgcmVzQm9keSA9ICJ7IFwiaWRcIjpcIiIgKyBkZXZpY2VJZCArICJcIiwgXCJyZXN1bHRcIjpcIiIgKyBvdXRwdXQuUmVwbGFjZShcIlwiXCIsIFwiXFxcIlwiKS5SZXBsYWNlKCJcclxuIiwgIlxcbiIpICsgIlwiIH0iOwogICAgICAgICAgICAgICAgICAgICAgICBjbGllbnQuVXBsb2FkU3RyaW5nKGFwaVVybCArICIvYXBpL3J1c3RkZXNrL2NvbW1hbmQvcmVzdWx0IiwgIlBPU1QiLCByZXNCb2R5KTsKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0gY2F0Y2ggKUV4Y2VwdGlvbiBlKSB7IH0KICAgICAgICAgICAgVGhyZWFkLlNsZWVwKDEwMDAwKTsKICAgICAgICB9CiAgICB9Cn0=";

    const psScript = `# --- RUSTDESK GELISMIS RMM AJANI KURULUM ---
$ErrorActionPreference = "SilentlyContinue"

$idServer = "${idServer}"
$relayServer = "${relayServer}"
$apiServer = "${apiServer}"
$serverKey = "${serverKey}"
$finalPass = "${defaultPassword}"

Write-Host ">> Islem Baslatildi (ID Server: $idServer)" -ForegroundColor Cyan

# 1. Temizlik ve Hazirlik
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }
Stop-Process -Name "rustdesk" -Force -ErrorAction SilentlyContinue

# 2. RustDesk Ayarlari
$toml = @"
rendezvous-server = '$idServer'
relay-server = '$relayServer'
api-server = '$apiServer'
key = '$serverKey'
[options]
custom-rendezvous-server = '$idServer'
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
$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)
foreach ($path in $configPaths) {
    if (!(Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path $path "RustDesk2.toml"), $toml, $utf8NoBOM)
}

# 3. RustDesk Yukle
Write-Host ">> RustDesk yukleniyor..." -ForegroundColor Cyan
$setupPath = Join-Path $env:TEMP "rustdesk_setup.exe"
Invoke-WebRequest -Uri "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe" -OutFile $setupPath -UseBasicParsing
Start-Process $setupPath -ArgumentList "--silent-install" -Wait

# 4. Sifre ve Servis
$rdExe = "C:\\Program Files\\RustDesk\\rustdesk.exe"
if (Test-Path $rdExe) {
    & $rdExe --set-password "$finalPass"
    Start-Service "rustdesk" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    & $rdExe --set-password "$finalPass"
}

# 5. RMM Ajanini Kur (Shell Destegi Aktif)
Write-Host ">> Gelismis RMM Ajanı kuruluyor..." -ForegroundColor Cyan
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

Write-Host ">> KURULUM TAMAMLANDI!" -ForegroundColor Green
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
