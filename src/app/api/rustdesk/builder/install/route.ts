import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getSettings();
    
    // Header'lardan baz URL'i al (HTTPS uyumu için)
    const hostHeader = req.headers.get("host");
    const currentHost = hostHeader?.split(":")[0] || "rmm.talay.com";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    
    // Eğer ayarlardaki apiServer eski yerel IP ise onu yok sayalım
    let baseUrl = settings.apiServer;
    if (!baseUrl || (baseUrl.includes("192.168.0.184") && !currentHost.startsWith("192.168."))) {
      baseUrl = `${protocol}://${hostHeader}`;
    }

    let idServer = searchParams.get("host") || settings.idServer || settings.host || currentHost;
    // Eski varsayılan IP'yi canlı ortamda rmm.talay.com ile değiştirelim
    if (idServer === "192.168.0.184" && !currentHost.startsWith("192.168.")) {
      idServer = currentHost;
    }

    const relayServer = settings.relayServer && settings.relayServer !== "192.168.0.184" ? settings.relayServer : idServer;
    const apiPort     = searchParams.get("port") || settings.port || "3000";
    const apiServer   = baseUrl;
    const password    = settings.defaultPassword || "Ban41kam5";

    // Sunucu anahtarını dosya sisteminden oku, yoksa settings'den al
    const keyPaths = [
      "C:\\ProgramData\\RustDesk\\config\\id_ed25519.pub",
      "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\id_ed25519.pub",
      path.join(process.cwd(), "id_ed25519.pub"),
    ];
    let serverKey = settings.serverKey || "";
    for (const p of keyPaths) {
      try {
        if (fs.existsSync(p)) { serverKey = fs.readFileSync(p, "utf-8").trim(); break; }
      } catch { continue; }
    }

    const psScript = `# --- RUSTDESK KURULUM SCRIPT ---
$ErrorActionPreference = "SilentlyContinue"

# 0. Yonetici Kontrolu
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[HATA] Bu scripti Administrator (Yonetici) olarak calistirmalisiniz!" -ForegroundColor Red
    exit 1
}

Write-Host "--- RustDesk Kurumsal Kurulum Baslatiliyor ---" -ForegroundColor Yellow

# TLS 1.2 zorla
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# 1. RustDesk Indir ve Kur
Write-Host ">> RustDesk yukleniyor..." -ForegroundColor Cyan
$setupPath = Join-Path $env:TEMP "rustdesk_setup.exe"
Invoke-WebRequest -Uri "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe" -OutFile $setupPath -UseBasicParsing

$fileSize = (Get-Item $setupPath -ErrorAction SilentlyContinue).Length
if (-not $fileSize -or $fileSize -lt 5000000) {
    Write-Host "[HATA] Dosya indirilemedi ($fileSize byte)" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dosya indirildi ($([math]::Round($fileSize/1MB,1)) MB)" -ForegroundColor Green

$proc = Start-Process $setupPath -ArgumentList "--silent-install" -PassThru
$timeout = 0
while ($proc -and !$proc.HasExited -and $timeout -lt 30) { Start-Sleep -Seconds 1; $timeout++ }

# Kurulum dogrula
Start-Sleep -Seconds 3
$rd = if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") { "C:\\Program Files\\RustDesk\\rustdesk.exe" } else { "C:\\Program Files (x86)\\RustDesk\\rustdesk.exe" }
if (-not (Test-Path $rd)) {
    Write-Host "[HATA] rustdesk.exe bulunamadi, kurulum basarisiz" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] RustDesk kuruldu" -ForegroundColor Green

# 2. Ayarlari Muhurle
Write-Host ">> Ayarlar muhurleniyor..." -ForegroundColor Cyan
Stop-Service -Name "rustdesk" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Get-Process "rustdesk" -ErrorAction SilentlyContinue | Stop-Process -Force

$toml = @"
rendezvous-server = '${idServer}'
relay-server = '${relayServer}'
api-server = '${apiServer}'
key = '${serverKey}'
verification-method = 'use-permanent-password'
permanent-password = '${password}'
approve-mode = 'password'
remote-user-confirmation = 'N'
allow-logon-screen-password = 'Y'
enable-remote-desktop = 'Y'
stop-service-on-user-logout = 'N'
permissions = 'all'
enable-uac = 'Y'
enable-remote-restart = 'Y'
allow-hostname-as-id = 'Y'
hide-tray = 'Y'
hide-stop-service = 'Y'
hide-network-settings = 'Y'
hide-security-settings = 'Y'
disable-change-permanent-password = 'Y'
remove-preset-password-warning = 'Y'

[options]
custom-rendezvous-server = '${idServer}'
relay-server = '${relayServer}'
api-server = '${apiServer}'
key = '${serverKey}'
verification-method = 'use-permanent-password'
permanent-password = '${password}'
approve-mode = 'password'
remote-user-confirmation = 'N'
allow-logon-screen-password = 'Y'
enable-remote-desktop = 'Y'
stop-service-on-user-logout = 'N'
permissions = 'all'
enable-uac = 'Y'
enable-remote-restart = 'Y'
allow-hostname-as-id = 'Y'
hide-tray = 'Y'
hide-stop-service = 'Y'
hide-network-settings = 'Y'
hide-security-settings = 'Y'
disable-change-permanent-password = 'Y'
remove-preset-password-warning = 'Y'
"@

$configPaths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml",
    "$env:ProgramData\\RustDesk\\config\\RustDesk2.toml",
    "$env:USERPROFILE\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml"
)
Get-ChildItem "C:\\Users" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $configPaths += "$($_.FullName)\\AppData\\Roaming\\RustDesk\\config\\RustDesk2.toml"
}
foreach ($cfgPath in $configPaths) {
    $dir = Split-Path $cfgPath
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($cfgPath, $toml, (New-Object System.Text.UTF8Encoding($false)))
}
Write-Host "[OK] Config yazildi" -ForegroundColor Green

# 3. Servisi baslat
Write-Host ">> Servis baslatiliyor..." -ForegroundColor Cyan
Start-Service rustdesk -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 4. CLI ile sifre ayarla
Write-Host ">> Sifre politikasi uygulaniyor..." -ForegroundColor Cyan
if (Test-Path $rd) {
    & $rd --password '${password}' 2>$null
    Start-Sleep -Seconds 1
    & $rd --set-password '${password}' 2>$null
}

# 5. RMM Ajani Kurulumu (v2 - Real-time WebSocket)
Write-Host ">> RMM Ajani (WebSocket) kuruluyor..." -ForegroundColor Cyan
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }

$rdId = ""
if (Test-Path $rd) {
    $rdId = (& $rd --get-id 2>$null) -replace '\\s',''
}
if (!$rdId) { $rdId = $env:COMPUTERNAME }

$wsUrl = "${apiServer}".Replace("http://", "ws://").Replace("https://", "wss://")

$agentScript = @"
\`$ErrorActionPreference = "SilentlyContinue"
\`$deviceId = "$rdId"
\`$wsUrl = "$wsUrl/agent-socket?deviceId=$rdId&type=agent"

Add-Type -AssemblyName System.Runtime.Serialization
\`$client = New-Object System.Net.WebSockets.ClientWebSocket

async function Start-Agent {
    while (\`$true) {
        try {
            if (\`$client.State -ne 'Open') {
                \`$client = New-Object System.Net.WebSockets.ClientWebSocket
                \`$uri = New-Object System.Uri(\`$wsUrl)
                \`$ct = New-Object System.Threading.CancellationTokenSource
                \`$client.ConnectAsync(\`$uri, \`$ct.Token).Wait()
                Write-Host "Connected to Server"
            }

            \`$buffer = New-Object Byte[] 4096
            \`$segment = New-Object ArraySegment[Byte] -ArgumentList @(,\`$buffer)
            \`$ct = New-Object System.Threading.CancellationTokenSource
            \`$result = \`$client.ReceiveAsync(\`$segment, \`$ct.Token).Result

            if (\`$result.MessageType -eq 'Text') {
                \`$message = [System.Text.Encoding]::UTF8.GetString(\`$buffer, 0, \`$result.Count)
                # Socket.io message format is complex, but for simplicity we look for "command"
                if (\`$message -match 'command') {
                    # Extract command action (simple regex)
                    \`$action = ""
                    if (\`$message -match '\\"action\\":\\"(.*?)\\"') { \`$action = \`$matches[1] }
                    \`$cmdText = ""
                    if (\`$message -match '\\"command\\":\\"(.*?)\\"') { \`$cmdText = \`$matches[1] }

                    Write-Host "Action: \`$action"
                    
                    if (\`$action -eq "lock") {
                        Add-Type -TypeDefinition '@
                            using System.Runtime.InteropServices;
                            public class Win32 {
                                [DllImport("user32.dll")] public static extern bool LockWorkStation();
                            }
'@
                        [Win32]::LockWorkStation()
                    }
                    elseif (\`$action -eq "restart") { shutdown /r /t 0 /f }
                    elseif (\`$action -eq "shutdown") { shutdown /s /t 0 /f }
                    elseif (\`$action -eq "terminal") {
                        \`$output = Invoke-Expression \`$cmdText | Out-String
                        # Send result back (Placeholder for direct socket emit)
                    }
                }
            }
        }
        catch {
            Write-Host "Connection error, retrying in 5s..."
            Start-Sleep -Seconds 5
        }
        Start-Sleep -Milliseconds 100
    }
}

# Start simple polling heartbeat for telemetry as well
async function Start-Telemetry {
    while (\`$true) {
        try {
            \`$free = (Get-PSDrive C).Free / 1GB
            \`$total = (Get-PSDrive C).Used / 1GB + \`$free
            \`$disk = "{0:N1} GB / {1:N1} GB" -f \`$free, \`$total
            \`$body = @{ id = \`$deviceId; disk = \`$disk; hostname = \`$env:COMPUTERNAME; os = "Windows" } | ConvertTo-Json
            Invoke-RestMethod -Uri "${apiServer}/api/heartbeat" -Method POST -Body \`$body -ContentType "application/json"
        } catch {}
        Start-Sleep -Seconds 30
    }
}

Start-Agent
"@

[System.IO.File]::WriteAllText("\$rmmDir\\Agent.ps1", \$agentScript, (New-Object System.Text.UTF8Encoding(\$false)))

# Setup Task to run hidden
$taskName = "RustDeskRMM_v2"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -File $rmmDir\\Agent.ps1"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$stgs = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Unregister-ScheduledTask -TaskName "RustDeskRMM_Service" -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $stgs -Force
Start-ScheduledTask -TaskName $taskName
Write-Host "[OK] RMM Ajani v2 kuruldu" -ForegroundColor Green
# 6. rdrmm:// URI Scheme Handler
Write-Host ">> rdrmm:// URI handler kuruluyor..." -ForegroundColor Cyan
$connectVbs = @'
Set args = WScript.Arguments
Dim id
id = args(0)
id = Replace(id, "rdrmm://", "")
id = Replace(id, "/", "")

Dim rdExe
rdExe = "C:\Program Files\RustDesk\rustdesk.exe"
If Not CreateObject("Scripting.FileSystemObject").FileExists(rdExe) Then
    rdExe = "C:\Program Files (x86)\RustDesk\rustdesk.exe"
End If

Dim oShell
Set oShell = CreateObject("WScript.Shell")
oShell.Run """" & rdExe & """ --connect " & id & " ${password}", 1, False
'@
[System.IO.File]::WriteAllText("$rmmDir\\connect.vbs", $connectVbs, (New-Object System.Text.UTF8Encoding($false)))

$regBase = "HKLM:\\SOFTWARE\\Classes\\rdrmm"
New-Item -Path $regBase -Force | Out-Null
Set-ItemProperty -Path $regBase -Name "(Default)" -Value "URL:RustDesk RMM Connection"
New-ItemProperty -Path $regBase -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null
New-Item -Path "$regBase\\DefaultIcon" -Force | Out-Null
Set-ItemProperty -Path "$regBase\\DefaultIcon" -Name "(Default)" -Value "$rd,0"
New-Item -Path "$regBase\\shell\\open\\command" -Force | Out-Null
Set-ItemProperty -Path "$regBase\\shell\\open\\command" -Name "(Default)" -Value "wscript.exe //B \`"$rmmDir\\connect.vbs\`" \`"%1\`""

Write-Host ""
Write-Host "--- KURULUM TAMAMLANDI ---" -ForegroundColor Green
Write-Host "Sunucu : ${idServer}" -ForegroundColor White
if ($rdId) { Write-Host "Cihaz ID: $rdId" -ForegroundColor Yellow }
`;

    return new Response(psScript, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="install.ps1"'
      }
    });

  } catch (error: any) {
    console.error("Builder Error:", error);
    return NextResponse.json({ error: "Script oluşturulamadı" }, { status: 500 });
  }
}
