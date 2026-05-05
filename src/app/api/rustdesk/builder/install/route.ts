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

# 5. RMM Ajani Kurulumu (Kalp Atisi)
Write-Host ">> RMM Ajani (Heartbeat) kuruluyor..." -ForegroundColor Cyan
$rmmDir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $rmmDir)) { New-Item -ItemType Directory -Path $rmmDir -Force | Out-Null }

$rdId = ""
if (Test-Path $rd) {
    $rdId = (& $rd --get-id 2>$null) -replace '\\s',''
}

$agentSource = @"
using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Net.NetworkInformation;
using System.IO;

public class RustDeskAgent {
    [DllImport("user32.dll")] public static extern bool LockWorkStation();
    public static void Main() {
        string serverUrl = "${apiServer}/api/heartbeat";
        string resultUrl = "${apiServer}/api/rustdesk/command/result";
        string deviceId = "$rdId"; 
        if (string.IsNullOrEmpty(deviceId)) deviceId = Environment.MachineName;

        WebClient client = new WebClient();
        client.Encoding = Encoding.UTF8;
        while (true) {
            try {
                DriveInfo c = new DriveInfo("C");
                string disk = string.Format("{0:N1} GB / {1:N1} GB", c.AvailableFreeSpace / 1073741824.0, c.TotalSize / 1073741824.0);
                List<string> cards = new List<string>();
                foreach (var ni in NetworkInterface.GetAllNetworkInterfaces()) {
                    if (ni.OperationalStatus == OperationalStatus.Up && ni.NetworkInterfaceType != NetworkInterfaceType.Loopback) {
                        foreach (var ip in ni.GetIPProperties().UnicastAddresses) {
                            if (ip.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork) {
                                string gw = ni.GetIPProperties().GatewayAddresses.Count > 0 ? ni.GetIPProperties().GatewayAddresses[0].Address.ToString() : "-";
                                cards.Add("{\\"name\\":\\"" + ni.Name + "\\", \\"ip\\":\\"" + ip.Address.ToString() + "\\", \\"mask\\":\\"" + ip.IPv4Mask.ToString() + "\\", \\"gw\\":\\"" + gw + "\\"}");
                            }
                        }
                    }
                }
                string body = "{\\"id\\":\\"" + deviceId + "\\", \\"disk\\":\\"" + disk + "\\", \\"hostname\\":\\"" + Environment.MachineName + "\\", \\"os\\":\\"Windows\\", \\"network\\":[" + string.Join(",", cards.ToArray()) + "]}";
                client.Headers[HttpRequestHeader.ContentType] = "application/json";
                string resString = client.UploadString(serverUrl, "POST", body);
                if (resString.Contains("\\"command\\":\\"") && !resString.Contains("\\"command\\":null")) {
                    string cmd = resString.Split(new[] { "\\"command\\":\\"" }, StringSplitOptions.None)[1].Split('"')[0];
                    if (cmd == "lock") LockWorkStation();
                    else if (cmd == "tsdiscon") Process.Start("tsdiscon.exe");
                    else if (cmd == "shutdown /s /t 5 /f") Process.Start("shutdown", "/s /t 0 /f");
                    else if (cmd == "shutdown /r /t 5 /f") Process.Start("shutdown", "/r /t 0 /f");
                    else if (cmd != "refresh_info") {
                        ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + cmd) { RedirectStandardOutput = true, UseShellExecute = false, CreateNoWindow = true };
                        var p = Process.Start(psi);
                        string output = p.StandardOutput.ReadToEnd();
                        string b64Output = Convert.ToBase64String(Encoding.UTF8.GetBytes(output));
                        string resultBody = "{\\"deviceId\\":\\"" + deviceId + "\\", \\"output\\":\\"" + b64Output + "\\", \\"isBase64\\": true}";
                        client.Headers[HttpRequestHeader.ContentType] = "application/json";
                        client.UploadString(resultUrl, "POST", resultBody);
                    }
                }
            } catch { }
            Thread.Sleep(10000);
        }
    }
}
"@
[System.IO.File]::WriteAllText("$rmmDir\\Agent.cs", $agentSource, (New-Object System.Text.UTF8Encoding($false)))

$csc = (Get-ChildItem "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.*\\csc.exe" | Select-Object -First 1).FullName
if ($csc) {
    Stop-Process -Name "RustDeskRMM" -ErrorAction SilentlyContinue
    & $csc /out:"$rmmDir\\RustDeskRMM.exe" /target:winexe "$rmmDir\\Agent.cs"
    
    $taskName = "RustDeskRMM_Service"
    $action = New-ScheduledTaskAction -Execute "$rmmDir\\RustDeskRMM.exe"
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
    $stgs = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $stgs -Force
    Start-ScheduledTask -TaskName $taskName
    Write-Host "[OK] RMM Ajani servis olarak kuruldu" -ForegroundColor Green
} else {
    Write-Host "[UYARI] .NET Framework (csc.exe) bulunamadi, RMM Ajani kurulamadi." -ForegroundColor Yellow
}

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
