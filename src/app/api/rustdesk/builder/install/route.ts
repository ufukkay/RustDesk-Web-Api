import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Dinamik olarak yapılandırılmış bir PowerShell kurulum scripti döner.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getSettings();
    
    // Varsayılan değerler
    const host = searchParams.get("host") || settings.host;
    const port = searchParams.get("port") || settings.port;
    const defaultPassword = settings.defaultPassword || "";
    
    // Sunucu anahtarını bulmaya çalış
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

    // Dinamik PowerShell Scripti
    const psScript = `# --- RUSTDESK RMM MASTER INSTALLER ---
# Otomatik olusturuldu: ${new Date().toLocaleString("tr-TR")}

$ErrorActionPreference = "SilentlyContinue"
$serverUrl = "${fullServerUrl}"
$serverKey = "${serverKey}"
$defPass = "${defaultPassword}"

Write-Host "--- RustDesk RMM Kurulumu Baslatiliyor ---" -ForegroundColor Yellow

# 1. Klasorleri Hazirla
$dir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }

# 2. RustDesk 1.4.6 İndir ve Servis Olarak Kur
$rdVersion = "1.4.6"
$rdUrl = "https://github.com/rustdesk/rustdesk/releases/download/$rdVersion/rustdesk-$rdVersion-x86_64.exe"
$rdFilename = "rustdesk-host=$($host)-key=$($serverKey).exe"
$rdPath = Join-Path $env:TEMP "$rdFilename"

Write-Host ">> RustDesk $rdVersion indiriliyor..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $rdUrl -OutFile $rdPath -UseBasicParsing

Write-Host ">> Servis kurulumu baslatiliyor (Sessiz)..." -ForegroundColor Cyan
taskkill /F /IM RustDesk.exe /T 2>$null
Start-Sleep -Seconds 2

Start-Process $rdPath -ArgumentList "--silent-install"

# Servisin kurulmasını bekle
$waitTimeout = 20
while (!(Get-Service "rustdesk" -ErrorAction SilentlyContinue) -and $waitTimeout -gt 0) {
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
    $waitTimeout--
}
Write-Host ""

# Şifre Belirle
if ($defPass) {
    Write-Host ">> Baglanti sifresi tanimlaniyor ($defPass)..." -ForegroundColor Cyan
    $rdExe = "C:\\Program Files\\RustDesk\\rustdesk.exe"
    if (Test-Path $rdExe) {
        # Farkli parametreleri dene (Versiyon farkliliklari icin)
        Start-Process $rdExe -ArgumentList "--set-password", "$defPass" -Wait -WindowStyle Hidden
        Start-Process $rdExe -ArgumentList "--password", "$defPass" -Wait -WindowStyle Hidden
        Write-Host ">> Sifre komutlari gonderildi." -ForegroundColor Green
    }
}

# 3. Konfigürasyon Dosyasını Oluştur
Write-Host ">> Sunucu ayarları sisteme işleniyor..." -ForegroundColor Cyan

$tomlContent = @"
id-server = '$host'
relay-server = '$host'
api-server = 'http://$host:3000'
key = '$serverKey'
"@

$serviceConfigDir = "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config"
if (!(Test-Path $serviceConfigDir)) { New-Item -ItemType Directory -Path $serviceConfigDir -Force }
$tomlContent | Out-File -FilePath "$serviceConfigDir\\RustDesk.toml" -Encoding utf8 -Force

$userConfigDir = "$env:AppData\\RustDesk\\config"
if (!(Test-Path $userConfigDir)) { New-Item -ItemType Directory -Path $userConfigDir -Force }
$tomlContent | Out-File -FilePath "$userConfigDir\\RustDesk.toml" -Encoding utf8 -Force

Get-Service "rustdesk" -ErrorAction SilentlyContinue | Restart-Service -Force
Write-Host ">> Ayarlar uygulandı." -ForegroundColor Green

# 4. RMM Ajanini Kur
Write-Host ">> RMM Ajani yapılandırılıyor..." -ForegroundColor Cyan

$rdId = ""
$possiblePaths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\RustDesk.toml",
    "$env:ProgramData\\RustDesk\\config\\RustDesk.toml",
    "$env:AppData\\RustDesk\\config\\RustDesk.toml"
)

function Get-RustDeskID {
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $content = Get-Content $p -Raw -ErrorAction SilentlyContinue
            if ($content -match "id\s*=\s*'(\d+)'") { return $matches[1] }
            if ($content -match "id\s*=\s*""(\d+)""") { return $matches[1] }
        }
    }
    if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") {
        $cmdId = & "C:\\Program Files\\RustDesk\\rustdesk.exe" --get-id 2>$null
        if ($cmdId -match "^\d+$") { return $cmdId }
    }
    return ""
}

$rdId = Get-RustDeskID
if (-not $rdId) {
    Write-Host ">> ID bekleniyor..." -ForegroundColor Yellow
    Start-Process "C:\\Program Files\\RustDesk\\rustdesk.exe" --ArgumentList "--service" -WindowStyle Hidden -ErrorAction SilentlyContinue
    $timeout = 20
    while (-not $rdId -and $timeout -gt 0) {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        $rdId = Get-RustDeskID
        $timeout--
    }
    Write-Host ""
}

$agentId = if ($rdId) { $rdId } else { "0" }

# Agent Kaynak Kodu
$source = @"
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
    public static void Main() {
        string serverUrl = "$($serverUrl)/api/heartbeat";
        string resultUrl = "$($serverUrl)/api/rustdesk/command/result";
        string deviceId = "$agentId"; 
        WebClient client = new WebClient();
        client.Encoding = Encoding.UTF8;
        
        while (true) {
            try {
                DriveInfo c = new DriveInfo("C");
                string disk = string.Format("{0:N1} GB / {1:N1} GB", c.AvailableFreeSpace / 1073741824.0, c.TotalSize / 1073741824.0);
                
                List<string> cardJsons = new List<string>();
                foreach (var ni in NetworkInterface.GetAllNetworkInterfaces()) {
                    if (ni.OperationalStatus == OperationalStatus.Up && ni.NetworkInterfaceType != NetworkInterfaceType.Loopback) {
                        foreach (var ip in ni.GetIPProperties().UnicastAddresses) {
                            if (ip.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork) {
                                string gw = ni.GetIPProperties().GatewayAddresses.Count > 0 ? ni.GetIPProperties().GatewayAddresses[0].Address.ToString() : "-";
                                string card = "{ \"name\":\"" + ni.Name.Replace("\"", "'") + "\", \"ip\":\"" + ip.Address.ToString() + "\", \"mask\":\"" + ip.IPv4Mask.ToString() + "\", \"gw\":\"" + gw + "\" }";
                                cardJsons.Add(card);
                            }
                        }
                    }
                }

                string body = "{ \"id\":\"" + deviceId + "\", \"disk\":\"" + disk + "\", \"hostname\":\"" + Environment.MachineName + "\", \"os\":\"Windows\", \"network\":[" + string.Join(",", cardJsons.ToArray()) + "] }";
                client.Headers[HttpRequestHeader.ContentType] = "application/json";
                string res = client.UploadString(serverUrl, "POST", body);
                
                if (res.Contains("\"command\":\"") && !res.Contains("\"command\":null")) {
                    string cmd = res.Split(new string[] { "\"command\":\"" }, StringSplitOptions.None)[1].Split('"')[0];
                    string output = "";
                    if (cmd == "tsdiscon" || cmd == "lock") { Process.Start(@"C:\Windows\System32\tsdiscon.exe"); output = "Locked"; }
                    else if (cmd.Contains("shutdown /s")) { Process.Start("shutdown.exe", "/s /t 5 /f"); output = "Shutting down..."; }
                    else if (cmd.Contains("shutdown /r")) { Process.Start("shutdown.exe", "/r /t 5 /f"); output = "Restarting..."; }
                    else if (cmd != "refresh_info") {
                        try {
                            ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + cmd);
                            psi.RedirectStandardOutput = true; psi.RedirectStandardError = true; psi.UseShellExecute = false; psi.CreateNoWindow = true;
                            using (var p = Process.Start(psi)) {
                                output = p.StandardOutput.ReadToEnd();
                                string err = p.StandardError.ReadToEnd();
                                if (!string.IsNullOrEmpty(err)) output += " Error: " + err;
                                p.WaitForExit(15000);
                            }
                        } catch (Exception ex) { output = "Error: " + ex.Message; }
                    }

                    if (!string.IsNullOrEmpty(output)) {
                        string b64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(output));
                        string rBody = "{ \"deviceId\":\"" + deviceId + "\", \"output\":\"" + b64 + "\", \"isBase64\": true }";
                        client.Headers[HttpRequestHeader.ContentType] = "application/json";
                        client.UploadString(resultUrl, "POST", rBody);
                    }
                }
            } catch {}
            Thread.Sleep(10000);
        }
    }
}
"@

$source | Out-File -FilePath "$dir\\Agent.cs" -Encoding utf8 -Force

# Derleme ve Servis Kaydı
$csc = (Get-ChildItem "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.*\\csc.exe" | Select-Object -First 1).FullName
taskkill /F /IM RustDeskRMM.exe /T 2>$null
& $csc /out:"$dir\\RustDeskRMM.exe" /target:winexe "$dir\\Agent.cs"

# Gorev Zamanlayici Olarak Ekle
$taskName = "RustDeskRMM_Service"
$action = New-ScheduledTaskAction -Execute "$dir\\RustDeskRMM.exe"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
Start-ScheduledTask -TaskName $taskName

Write-Host "------------------------------------------------" -ForegroundColor Yellow
Write-Host "BAŞARILI: RustDesk ve RMM Ajani Kuruldu! ✅" -ForegroundColor Green
Write-Host "Cihaz simdi Dashboard uzerinde gorunmelidir." -ForegroundColor Gray
Write-Host "BİTTİ" -ForegroundColor White -BackgroundColor Green
`;

    return new Response(psScript, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="install.ps1"'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Script olusturulamadi" }, { status: 500 });
  }
}
