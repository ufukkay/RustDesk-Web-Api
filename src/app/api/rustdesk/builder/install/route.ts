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
    
    const idServer = settings.idServer || host;
    const relayServer = settings.relayServer || host;
    const apiServer = settings.apiServer || `http://${host}:${port}`;
    const defaultPassword = settings.defaultPassword || "Ban41kam5";
    
    let serverKey = settings.serverKey || "YOK";
    
    // Eğer ayarlarda yoksa otomatik bulmaya çalış
    if (serverKey === "YOK" || !serverKey) {
      const keyPaths = [
        "C:\\ProgramData\\RustDesk\\config\\id_ed25519.pub",
        "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\id_ed25519.pub",
        path.join(process.cwd(), "id_ed25519.pub")
      ];
      for (const p of keyPaths) {
        try { if (fs.existsSync(p)) { serverKey = fs.readFileSync(p, "utf-8").trim(); break; } } catch (e) {}
      }
    }

    // C# Agent Kodu (Base64) - Main(string[] args) eklendi ve sadeleştirildi
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLklPOwp1c2luZyBTeXN0ZW0uVGV4dC5SZWd1bGFyRXhwcmVzc2lvbnM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwoKY2xhc3MgUHJvZ3JhbSB7CiAgICBzdGF0aWMgdm9pZCBNYWluKHN0cmluZyVbXSBhcmdzKSB7CiAgICAgICAgc3RyaW5nIHNlcnZpY2VVcmwgPSAiW1tTRVJWRVJfVVJMXV0vYXBpL2hlYXJ0YmVhdCI7CiAgICAgICAgV2ViQ2xpZW50IGNsaWVudCA9IG5ldyBXZWJDbGllbnQoKTsKICAgICAgICBjbGllbnQuRW5jb2RpbmcgPSBFbmNvZGluZy5VVEY4OwogICAgICAgIAogICAgICAgIHdoaWxlICh0cnVlKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICBzdHJpbmcgZGV2aWNlSWQgPSAiIjsKICAgICAgICAgICAgICAgIHN0cmluZyBbXSBwYXRocyA9IHsKICAgICAgICAgICAgICAgICAgICBAIkM6XFdpbmRvd3NcU2VydmljZVByb2ZpbGVzXExvY2FsU2VydmljZVxBcHBEYXRhXFJvYW1pbmdcUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrLnRvbWwiLAogICAgICAgICAgICAgICAgICAgIEAiQzpcV2luZG93c1xTZXJ2aWNlUHJvZmlsZXNcTG9jYWxTZXJ2aWNlXEFwcERhdGFcUm9hbWluZ1xSdXN0RGVza1xjb25maWdcUnVzdERlc2syLnRvbWwiLAogICAgICAgICAgICAgICAgICAgIEAiQzpcUHJvZ3JhbURhdGFcUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrLnRvbWwiLAogICAgICAgICAgICAgICAgICAgIEAiQzpcUHJvZ3JhbURhdGFcUnVzdERlc2tcY29uZmlnXFJ1c3REZXNrMi50b21sIgogICAgICAgICAgICAgICAgfTsKICAgICAgICAgICAgICAgIGZvcmVhY2ggKHN0cmluZyBwdCBpbiBwYXRocykgewogICAgICAgICAgICAgICAgICAgIGlmIChGaWxlLkV4aXN0cyhwdCkpIHsKICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nIGMgPSBGaWxlLlJlYWRBbGxUZXh0KHB0KTsKICAgICAgICAgICAgICAgICAgICAgICAgTWF0Y2ggbSA9IFJlZ2V4Lk1hdGNoKGMsIEAiaWRccyo9XHMqJyhcZCspJyIpOwogICAgICAgICAgICAgICAgICAgICAgICBpZiAobS5TdWNjZXNzKSB7IGRldmljZUlkID0gbS5Hcm91cHNbMV0uVmFsdWU7IGJyZWFrOyB9CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgaWYgKHN0cmluZy5Jc051bGxPckVtcHR5KGRldmljZUlkKSkgZGV2aWNlSWQgPSBFbnZpcm9ubWVudC5NYWNoaW5lTmFtZTsKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgc3RyaW5nIGJvZHkgPSAieyBcImlkXCI6XCIiICsgZGV2aWNlSWQgKyBcIiwgXCJob3N0bmFtZVwiOlwiIiArIEVudmlyb25tZW50Lk1hY2hpbmVOYW1lICsgXCIsIFwib3NcIjpcIndpbmRvd3NcIiB9IjsKICAgICAgICAgICAgICAgIGNsaWVudC5IZWFkZXJzW0h0dHBSZXF1ZXN0SGVhZGVyLkNvbnRlbnRUeXBlXSA9ICJhcHBsaWNhdGlvbi9qc29uIjsKICAgICAgICAgICAgICAgIGNsaWVudC5VcGxvYWRTdHJpbmcoc2VydmljZVVybCwgIlBPU1QiLCBib2R5KTsKICAgICAgICAgICAgfSBjYXRjaCB7fQogICAgICAgICAgICBUaHJlYWQuU2xlZXAoMTAwMDApOwogICAgICAgIH0KICAgIH0KfQ==";

    const psScript = `# --- RUSTDESK TAM OTOMATIK WINDOWS KURULUM ---
$ErrorActionPreference = "SilentlyContinue"

$idServer = "${idServer}"
$relayServer = "${relayServer}"
$apiServer = "${apiServer}"
$serverKey = "${serverKey}"
$finalPass = "${defaultPassword}"

Write-Host ">> Islem Baslatildi (ID Server: $idServer)" -ForegroundColor Cyan

# 1. Temizlik
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }
Stop-Process -Name "rustdesk" -Force -ErrorAction SilentlyContinue

# 2. Sunucu Ayarları Hazırla
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
    "$env:AppData\\RustDesk\\config"
)
$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)
foreach ($path in $configPaths) {
    if (!(Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path $path "RustDesk2.toml"), $toml, $utf8NoBOM)
}

# 3. Indir ve Kur
Write-Host ">> RustDesk yukleniyor..." -ForegroundColor Cyan
$setupPath = Join-Path $env:TEMP "rustdesk_setup.exe"
Invoke-WebRequest -Uri "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe" -OutFile $setupPath -UseBasicParsing
Start-Process $setupPath -ArgumentList "--silent-install" -Wait

# 4. Sifre Ayari (Agresif Yontem)
$rdExe = "C:\\Program Files\\RustDesk\\rustdesk.exe"
if (Test-Path $rdExe) {
    Write-Host ">> Sifre sabitleniyor..." -ForegroundColor Cyan
    & $rdExe --set-password "$finalPass"
    Start-Service "rustdesk" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    & $rdExe --set-password "$finalPass"
}

# 5. RMM Ajanini Kur
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
