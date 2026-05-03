import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET /api/rustdesk/builder/install
 * Dinamik olarak yapılandırılmış bir PowerShell kurulum scripti döner.
 * Bu script hem RustDesk'i indirir hem de RMM Ajanını kurar.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Varsayılan değerler (İstekle gelen parametreler veya sunucu ayarları)
    const host = searchParams.get("host") || "192.168.0.184";
    const port = searchParams.get("port") || "3000";
    
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

Write-Host "--- RustDesk RMM Kurulumu Baslatiliyor ---" -ForegroundColor Yellow

# 1. Klasorleri Hazirla
$dir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }

# 2. RustDesk 1.4.6 İndir ve Servis Olarak Kur
$rdVersion = "1.4.6"
$rdUrl = "https://github.com/rustdesk/rustdesk/releases/download/$rdVersion/rustdesk-$rdVersion-x86_64.exe"
$rdFilename = "rustdesk-host=$($host)-key=$($serverKey).exe"
$rdPath = Join-Path $env:TEMP "$rdFilename" # Geçici klasöre indir

Write-Host ">> RustDesk $rdVersion indiriliyor ve Servis olarak kuruluyor..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $rdUrl -OutFile $rdPath

# Sessiz kurulum (Servis olarak yükler, soru sormaz)
Start-Process $rdPath -ArgumentList "--silent-install" -Wait
Write-Host ">> RustDesk Servis kurulumu tamamlandı." -ForegroundColor Green

# 3. Konfigürasyon Dosyasını Oluştur (Kritik: Servis ve Kullanıcı için)
Write-Host ">> Sunucu ayarları sisteme işleniyor..." -ForegroundColor Cyan

$tomlContent = @"
id-server = '$host'
relay-server = '$host'
api-server = 'http://$host:3000'
key = '$serverKey'
"@

# A. Kullanıcı Profili İçin
$userConfigDir = "$env:AppData\\RustDesk\\config"
if (!(Test-Path $userConfigDir)) { New-Item -ItemType Directory -Path $userConfigDir -Force }
$tomlContent | Out-File -FilePath "$userConfigDir\\RustDesk.toml" -Encoding utf8 -Force

# B. Sistem Servisi İçin (Cihaz açılınca çalışması için burası kritik)
$serviceConfigDir = "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config"
if (!(Test-Path $serviceConfigDir)) { New-Item -ItemType Directory -Path $serviceConfigDir -Force }
$tomlContent | Out-File -FilePath "$serviceConfigDir\\RustDesk.toml" -Encoding utf8 -Force

# Servisi yeniden başlat ki ayarları anında alsın
Get-Service "rustdesk" -ErrorAction SilentlyContinue | Restart-Service -Force
Write-Host ">> Ayarlar uygulandı ve servis yeniden başlatıldı." -ForegroundColor Green

# 4. RMM Ajanini Kur
Write-Host ">> RMM Ajani yapılandırılıyor..." -ForegroundColor Cyan

# Mevcut RustDesk ID'sini bulmaya calis (Eger onceden kuruluysa)
$rdId = ""
$possiblePaths = @(
    "$env:ProgramData\\RustDesk\\config\\RustDesk.toml",
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\RustDesk.toml",
    "$env:AppData\\RustDesk\\config\\RustDesk.toml"
)
foreach ($p in $possiblePaths) {
    if (Test-Path $p) {
        $content = Get-Content $p
        if ($content -match "id\\s*=\\s*'(\\d+)'") { $rdId = $matches[1]; break }
    }
}

if (-not $rdId) {
    Write-Host ">> RustDesk ID bekleniyor... (Uygulama baslatiliyor)" -ForegroundColor Yellow
    # RustDesk'i baslat ki ID olussun
    Start-Process $rdPath
    $timeout = 20
    while (-not $rdId -and $timeout -gt 0) {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        foreach ($p in $possiblePaths) {
            if (Test-Path $p) {
                $content = Get-Content $p
                if ($content -match "id\\s*=\\s*'(\\d+)'") { $rdId = $matches[1]; break }
            }
        }
        $timeout--
    }
    Write-Host ""
}

if (-not $rdId) {
    Write-Host "!! ID tespiti zaman asimina ugradi. Lutfen manuel yapılandırın." -ForegroundColor Red
    $rdId = "BEKLEMEDE"
}

# Agent Kaynak Kodu (Geliştirilmiş Versiyon)
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
    [DllImport("user32.dll")] public static extern bool LockWorkStation();
    
    private static string logFile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "RustDeskRMM", "agent.log");

    private static void Log(string msg) {
        try { File.AppendAllText(logFile, "[" + DateTime.Now.ToString() + "] " + msg + Environment.NewLine); } catch {}
    }

    public static void Main() {
        string serverUrl = "$($serverUrl)/api/heartbeat";
        string resultUrl = "$($serverUrl)/api/rustdesk/command/result";
        string deviceId = "$rdId"; 
        WebClient client = new WebClient();
        client.Encoding = Encoding.UTF8;
        
        Log("Agent baslatildi. DeviceID: " + deviceId);

        while (true) {
            try {
                // Sistem Bilgilerini Topla
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
                
                // Komut Kontrolü
                if (resString.Contains("\\"command\\":\\"") && !resString.Contains("\\"command\\":null")) {
                    string cmd = resString.Split(new[] { "\\"command\\":\\"" }, StringSplitOptions.None)[1].Split('"')[0];
                    Log("Komut alindi: " + cmd);

                    string output = "";
                    
                    if (cmd == "tsdiscon" || cmd == "lock") {
                        Process.Start("C:\\Windows\\System32\\tsdiscon.exe");
                        output = "Oturum kilitlendi (tsdiscon).";
                    }
                    else if (cmd.Contains("shutdown /s")) {
                        Process.Start("shutdown.exe", "/s /t 5 /f");
                        output = "Sistem kapatiliyor...";
                    }
                    else if (cmd.Contains("shutdown /r")) {
                        Process.Start("shutdown.exe", "/r /t 5 /f");
                        output = "Sistem yeniden baslatiliyor...";
                    }
                    else if (cmd != "refresh_info") {
                        // Genel Komut Çalıştırma (Terminal)
                        try {
                            ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + cmd) {
                                RedirectStandardOutput = true,
                                RedirectStandardError = true,
                                UseShellExecute = false,
                                CreateNoWindow = true
                            };
                            using (var p = Process.Start(psi)) {
                                output = p.StandardOutput.ReadToEnd();
                                string error = p.StandardError.ReadToEnd();
                                if (!string.IsNullOrEmpty(error)) output += "\\nHata: " + error;
                                p.WaitForExit(10000);
                            }
                        } catch (Exception ex) {
                            output = "Hata: " + ex.Message;
                        }
                    }

                    if (!string.IsNullOrEmpty(output)) {
                        string b64Output = Convert.ToBase64String(Encoding.UTF8.GetBytes(output));
                        string resultBody = "{\\"deviceId\\":\\"" + deviceId + "\\", \\"output\\":\\"" + b64Output + "\\", \\"isBase64\\": true}";
                        client.Headers[HttpRequestHeader.ContentType] = "application/json";
                        client.UploadString(resultUrl, "POST", resultBody);
                    }
                }
            } catch (Exception ex) {
                Log("Dongu hatasi: " + ex.Message);
            }
            Thread.Sleep(10000);
        }
    }
}
"@

$source | Out-File -FilePath "$dir\\Agent.cs" -Encoding utf8 -Force

# Derleme
$csc = (Get-ChildItem "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.*\\csc.exe" | Select-Object -First 1).FullName
Stop-Process -Name "RustDeskRMM" -ErrorAction SilentlyContinue
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
Write-Host "BAŞARILI: RustDesk Masaustune indirildi ve RMM Ajani kuruldu! ✅" -ForegroundColor Green
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
