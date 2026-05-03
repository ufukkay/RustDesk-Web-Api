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

Write-Host ">> RustDesk $rdVersion indiriliyor..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $rdUrl -OutFile $rdPath -UseBasicParsing

Write-Host ">> Servis kurulumu baslatiliyor (Sessiz)..." -ForegroundColor Cyan
# Mevcut süreçleri temizle
Stop-Process -Name "RustDesk" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# --silent-install parametresi soru sormadan yüklemeyi sağlar
Start-Process $rdPath -ArgumentList "--silent-install"

# Servisin kurulmasını bekle (Max 40 sn - Süre artırıldı)
$waitTimeout = 20
while (!(Get-Service "rustdesk" -ErrorAction SilentlyContinue) -and $waitTimeout -gt 0) {
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
    $waitTimeout--
}
Write-Host ""
Write-Host ">> RustDesk Servis durumu kontrol edildi." -ForegroundColor Green

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

$rdId = ""
$possiblePaths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\RustDesk.toml",
    "$env:ProgramData\\RustDesk\\config\\RustDesk.toml",
    "$env:AppData\\RustDesk\\config\\RustDesk.toml",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config\\RustDesk.toml"
)

function Get-RustDeskID {
    # 1. Dosyalardan oku
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            try {
                $content = Get-Content $p -Raw -ErrorAction SilentlyContinue
                if ($content -match "id\s*=\s*'(\d+)'") { return $matches[1] }
                if ($content -match "id\s*=\s*""(\d+)""") { return $matches[1] }
            } catch {}
        }
    }
    # 2. Komutla almayı dene
    if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") {
        $cmdId = & "C:\\Program Files\\RustDesk\\rustdesk.exe" --get-id 2>$null
        if ($cmdId -match "^\d+$") { return $cmdId }
    }
    return ""
}

$rdId = Get-RustDeskID

if (-not $rdId) {
    Write-Host ">> RustDesk ID bekleniyor... (Servis tetikleniyor)" -ForegroundColor Yellow
    # Servis modunda zorla baslat
    Start-Process "C:\\Program Files\\RustDesk\\rustdesk.exe" --ArgumentList "--service" -WindowStyle Hidden -ErrorAction SilentlyContinue
    $timeout = 30
    while (-not $rdId -and $timeout -gt 0) {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        $rdId = Get-RustDeskID
        $timeout--
    }
    Write-Host ""
}

if (-not $rdId) {
    Write-Host "!! ID tespiti yapilamadi, panelden manuel ekleyebilirsiniz." -ForegroundColor Red
    $rdId = "0"
}

# Agent Kaynak Kodu (C# 5 Uyumlu, Guvenli String Insaasi)
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
    
    private static string logFile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), @"RustDeskRMM\agent.log");

    private static void Log(string msg) {
        try { File.AppendAllText(logFile, "[" + DateTime.Now.ToString() + "] " + msg + Environment.NewLine); } catch {}
    }

    public static void Main() {
        string serverUrl = "$($serverUrl)/api/heartbeat";
        string resultUrl = "$($serverUrl)/api/rustdesk/command/result";
        string deviceId = "$rdId"; 
        WebClient client = new WebClient();
        client.Encoding = Encoding.UTF8;
        
        Log("Agent baslatildi. ID: " + deviceId);

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
                                string cName = ni.Name.Replace("\"", "'");
                                string cIp = ip.Address.ToString();
                                string cMask = ip.IPv4Mask.ToString();
                                // CS1010 hatasini onlemek icin parcali birlestirme
                                string card = "{ \"name\":\"" + cName + "\",";
                                card += " \"ip\":\"" + cIp + "\",";
                                card += " \"mask\":\"" + cMask + "\",";
                                card += " \"gw\":\"" + gw + "\" }";
                                cardJsons.Add(card);
                            }
                        }
                    }
                }

                string networkJson = string.Join(",", cardJsons.ToArray());
                string body = "{ \"id\":\"" + deviceId + "\", \"disk\":\"" + disk + "\",";
                body += " \"hostname\":\"" + Environment.MachineName + "\",";
                body += " \"os\":\"Windows\", \"network\":[" + networkJson + "] }";
                
                client.Headers[HttpRequestHeader.ContentType] = "application/json";
                string res = client.UploadString(serverUrl, "POST", body);
                
                if (res.Contains("\"command\":\"") && !res.Contains("\"command\":null")) {
                    string cmd = res.Split(new string[] { "\"command\":\"" }, StringSplitOptions.None)[1].Split('"')[0];
                    Log("Komut: " + cmd);

                    string output = "";
                    if (cmd == "tsdiscon" || cmd == "lock") {
                        Process.Start(@"C:\Windows\System32\tsdiscon.exe");
                        output = "Oturum kilitlendi.";
                    }
                    else if (cmd.Contains("shutdown /s")) {
                        Process.Start("shutdown.exe", "/s /t 5 /f");
                        output = "Kapatiliyor...";
                    }
                    else if (cmd.Contains("shutdown /r")) {
                        Process.Start("shutdown.exe", "/r /t 5 /f");
                        output = "Yeniden baslatiliyor...";
                    }
                    else if (cmd != "refresh_info") {
                        try {
                            ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + cmd);
                            psi.RedirectStandardOutput = true;
                            psi.RedirectStandardError = true;
                            psi.UseShellExecute = false;
                            psi.CreateNoWindow = true;
                            using (var p = Process.Start(psi)) {
                                output = p.StandardOutput.ReadToEnd();
                                string err = p.StandardError.ReadToEnd();
                                if (!string.IsNullOrEmpty(err)) output += " Error: " + err;
                                p.WaitForExit(15000);
                            }
                        } catch (Exception ex) {
                            output = "Hata: " + ex.Message;
                        }
                    }

                    if (!string.IsNullOrEmpty(output)) {
                        string b64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(output));
                        string rBody = "{ \"deviceId\":\"" + deviceId + "\", \"output\":\"" + b64 + "\", \"isBase64\": true }";
                        client.Headers[HttpRequestHeader.ContentType] = "application/json";
                        client.UploadString(resultUrl, "POST", rBody);
                    }
                }
            } catch (Exception ex) {
                Log("Hata: " + ex.Message);
            }
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
