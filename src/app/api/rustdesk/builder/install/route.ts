import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Mühürlü Blok Modu - PowerShell Değişken Kaybı Fixlendi.
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
    
    // PowerShell Script (TS uyumlu escape edildi)
    const psScript = `# --- RUSTDESK MUHURLU BLOK KURULUM ---
\$ErrorActionPreference = "SilentlyContinue"

\$idServer = "${idServer}"
\$relayServer = "${relayServer}"
\$apiServer = "${apiServer}"
\$serverKey = "${serverKey}"
\$finalPass = "${defaultPassword}"

Write-Host ">> Islem Baslatildi (Final Robust Mode)" -ForegroundColor Cyan

# 1. Temizlik
Stop-Process -Name "rustdesk" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "rustdesk_setup" -Force -ErrorAction SilentlyContinue

# 2. RustDesk Yukle
Write-Host ">> RustDesk kuruluyor..." -ForegroundColor Cyan
\$setupPath = Join-Path \$env:TEMP "rustdesk_setup.exe"
Invoke-WebRequest -Uri "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe" -OutFile \$setupPath -UseBasicParsing
\$proc = Start-Process \$setupPath -ArgumentList "--silent-install" -PassThru
\$timeout = 0
while (\$proc -and !\$proc.HasExited -and \$timeout -lt 20) { Start-Sleep -Seconds 1; \$timeout++ }

# 3. Ayarları Mühürle
Write-Host ">> Ayarlar muhurleniyor..." -ForegroundColor Cyan
Stop-Service -Name "rustdesk" -Force -ErrorAction SilentlyContinue

\$toml = @"
rendezvous-server = '\$idServer'
relay-server = '\$relayServer'
api-server = '\$apiServer'
key = '\$serverKey'
verification-method = 'use-permanent-password'
remote-user-confirmation = 'N'

[options]
custom-rendezvous-server = '\$idServer'
relay-server = '\$relayServer'
api-server = '\$apiServer'
key = '\$serverKey'
verification-method = 'use-permanent-password'
remote-user-confirmation = 'N'
stop-service-on-user-logout = 'N'
accept-error = ''
permissions = 'all'
enable-uac = 'Y'
"@

\$configPaths = @(
    "C:\\ProgramData\\RustDesk\\config",
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config"
)
\$utf8NoBOM = New-Object System.Text.UTF8Encoding(\$false)
foreach (\$path in \$configPaths) {
    if (!(Test-Path \$path)) { New-Item -ItemType Directory -Path \$path -Force | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path \$path "RustDesk.toml"), \$toml, \$utf8NoBOM)
    [System.IO.File]::WriteAllText((Join-Path \$path "RustDesk2.toml"), \$toml, \$utf8NoBOM)
}

# 4. CLI Zorlama
\$rdExe = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") { "C:\\Program Files\\RustDesk\\rustdesk.exe" } else { "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe" }
if (Test-Path \$rdExe) {
    & \$rdExe --config rendezvous-server="\$idServer"
    & \$rdExe --config relay-server="\$relayServer"
    & \$rdExe --config api-server="\$apiServer"
    & \$rdExe --config key="\$serverKey"
    & \$rdExe --config verification-method=use-permanent-password
    & \$rdExe --config remote-user-confirmation=N
    & \$rdExe --set-password "\$finalPass"
    Start-Service "rustdesk" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Restart-Service "rustdesk" -Force -ErrorAction SilentlyContinue
}

# 5. NATIVE POWERSHELL AJANI (Single-Quote Heredoc ile Degisken Koruma)
\$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path \$rmmDir)) { New-Item -ItemType Directory -Path \$rmmDir -Force | Out-Null }

# Burada @' ... '@ kullanarak PS degiskenlerini (\$) koruyoruz.
\$agentScript = @'
\$api = '[[SERVER_URL]]'
while(\$true) {
    try {
        \$id = ""
        \$p1 = "C:\\ProgramData\\RustDesk\\config\\RustDesk2.toml"
        # RustDesk ID bulana kadar bekle (Max 30 saniye)
        for (\$i = 0; \$i -lt 6; \$i++) {
            if (Test-Path \$p1) {
                \$cont = Get-Content \$p1 -Raw
                if (\$cont -match "id\\s*=\\s*[']?(\d+)[']?") { \$id = \$Matches[1]; break }
            }
            if (\$i -lt 5) { Start-Sleep -Seconds 5 }
        }
        if (!\$id) { \$id = \$env:COMPUTERNAME }

        # IP (VPN Atlama)
        \$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {\$_.InterfaceAlias -notlike '*Loopback*' -and \$_.InterfaceAlias -notlike '*Forti*'} | Select-Object -First 1).IPAddress
        if (!\$ip) { \$ip = "127.0.0.1" }

        # Disk
        \$diskInfo = Get-PSDrive C | Select-Object @{N='Free';E={[math]::Round(\$_.Free/1GB,2)}}, @{N='Total';E={[math]::Round((\$_.Used+\$_.Free)/1GB,2)}}
        \$disk = "\$(\$diskInfo.Free)GB / \$(\$diskInfo.Total)GB"

        \$body = @{ id="\$id"; hostname="\$env:COMPUTERNAME"; os="windows"; ip="\$ip"; disk="\$disk" } | ConvertTo-Json
        \$res = Invoke-RestMethod -Uri "\$api/api/heartbeat" -Method Post -Body \$body -ContentType "application/json" -TimeoutSec 5

        if (\$res.command) {
            \$out = iex \$res.command | Out-String
            if (!\$out) { \$out = "Komut ok." }
            \$resBody = @{ id="\$id"; result=[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(\$out)) } | ConvertTo-Json
            Invoke-RestMethod -Uri "\$api/api/rustdesk/command/result" -Method Post -Body \$resBody -ContentType "application/json"
        }
    } catch {
        "\$((Get-Date).ToString()) - Hata: \$(\$_.Exception.Message)" | Out-File -FilePath "C:\\ProgramData\\RustDeskRMM\\log.txt" -Append
    }
    Start-Sleep -Seconds 10
}
'@.Replace('[[SERVER_URL]]', \$apiServer)

[System.IO.File]::WriteAllText("\$rmmDir\\Agent.ps1", \$agentScript, \$utf8NoBOM)

# Servisi Kaydet ve Zorla Başlat
\$taskName = "RustDeskRMM_Native"
Unregister-ScheduledTask -TaskName \$taskName -Confirm:\$false -ErrorAction SilentlyContinue
\$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File \$rmmDir\\Agent.ps1"
\$trigger = New-ScheduledTaskTrigger -AtStartup
\$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
Register-ScheduledTask -TaskName \$taskName -Action \$action -Trigger \$trigger -Principal \$principal -Force
Start-ScheduledTask -TaskName \$taskName

Write-Host ">> AJAN MUHURLENDI VE BASLATILDI!" -ForegroundColor Green
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
