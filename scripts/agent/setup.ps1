# =============================================================================
# RUSTDESK RMM AGENT V3 — INSTALLER
# Dinamik URL destekli, WebSocket tabanli, sifir-dokunuslu kurulum
# =============================================================================

# --- 1. API SUNUCU URL TESPITI -----------------------------------------------
# Oncelik: (a) cagiran scriptten $apiServer degiskeni,
#           (b) disk uzerindeki settings.json,
#           (c) fallback hardcode

$settingsFile = "C:\ProgramData\RustDeskRMM\settings.json"

if (-not $apiServer) {
    if (Test-Path $settingsFile) {
        try {
            $cfg = Get-Content $settingsFile -Raw | ConvertFrom-Json
            $apiServer = $cfg.apiServer
        } catch {}
    }
    if (-not $apiServer) { $apiServer = "https://rmm.talay.com" }
}

# ws:// veya wss:// turkunu otomatik turetelim
$wsUrl = $apiServer -replace '^https://', 'wss://' -replace '^http://', 'ws://'
$wsUrl = $wsUrl.TrimEnd('/') + "/agent-socket"

# Ayarlari kaydet (standalone yeniden calistirma icin)
$dir = "C:\ProgramData\RustDeskRMM"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
@{ apiServer = $apiServer } | ConvertTo-Json | Set-Content $settingsFile -Encoding UTF8 -Force

Write-Host ">> API Server : $apiServer" -ForegroundColor Cyan
Write-Host ">> WebSocket  : $wsUrl"     -ForegroundColor Cyan

# --- 2. RUSTDESK ID TESPITI (ZERO-TOUCH, 15 DENEME) -------------------------
$rdId = ""
$possiblePaths = @(
    "$env:ProgramData\RustDesk\config\RustDesk.toml",
    "C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\RustDesk.toml",
    "$env:AppData\RustDesk\config\RustDesk.toml"
)

Write-Host ">> RustDesk ID araniyor..." -ForegroundColor Yellow
$retryCount = 0
while (-not $rdId -and $retryCount -lt 15) {
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $content = Get-Content $p -Raw -ErrorAction SilentlyContinue
            if ($content -match 'id\s*=\s*[''"]?(\d{6,15})[''"]?') {
                $rdId = $matches[1]
                Write-Host "[OK] ID bulundu: $rdId  ($p)" -ForegroundColor Cyan
                break
            }
        }
    }

    if (-not $rdId) {
        $rdExe = if (Test-Path "C:\Program Files\RustDesk\rustdesk.exe") {
            "C:\Program Files\RustDesk\rustdesk.exe"
        } else { "C:\Program Files (x86)\RustDesk\rustdesk.exe" }

        if (Test-Path $rdExe) {
            $cliId = (& $rdExe --get-id 2>$null) -replace '\s', ''
            if ($cliId -match '^\d{6,15}$') {
                $rdId = $cliId
                Write-Host "[OK] ID CLI ile bulundu: $rdId" -ForegroundColor Cyan
            }
        }
    }

    if (-not $rdId) {
        $retryCount++
        Write-Host "  ID henuz olusмadi, bekleniyor... ($retryCount/15)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 2
    }
}

if (-not $rdId) {
    Write-Error "CRITICAL: RustDesk ID bulunamadi. RustDesk kurulu ve internete baglanmis olmali."
    return
}

# --- 3. C# AGENT KAYNAK KODU (V3 - TAM WEBSOCKET) ---------------------------
$source = @"
using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Net.NetworkInformation;
using System.IO;
using Microsoft.Win32;
using System.Management;
using System.Net.WebSockets;

public class RustDeskAgent {
    [DllImport("user32.dll")]  static extern bool LockWorkStation();
    [DllImport("kernel32.dll")] static extern ulong GetTickCount64();

    static readonly string DeviceId     = "$rdId";
    static readonly string WsUrl        = "$wsUrl";
    static readonly string ApiServer    = "$apiServer";
    static readonly string AgentVersion = "v3.0.0";
    static readonly string LogFile      = @"C:\ProgramData\RustDeskRMM\agent.log";

    static void Log(string msg) {
        try { File.AppendAllText(LogFile, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " | " + msg + "\n"); } catch {}
    }

    static string Wmi(string cls, string prop) {
        try {
            using (var s = new ManagementObjectSearcher("SELECT " + prop + " FROM " + cls))
                foreach (ManagementObject o in s.Get())
                    if (o[prop] != null) return o[prop].ToString().Trim();
        } catch {}
        return "";
    }

    public static void Main() {
        ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; // TLS 1.2
        ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
        Log("Agent V3 basladi. DeviceId=" + DeviceId + " WS=" + WsUrl);
        RunLoop().GetAwaiter().GetResult();
    }

    static async Task RunLoop() {
        // HTTP Telemetri Döngüsü (Bağımsız çalışır)
        var _ = Task.Run(() => RunHttpTelemetryLoop());

        while (true) {
            try   { await ConnectAndRun(); }
            catch (Exception ex) { Log("RunLoop hatasi: " + ex.Message); }
            await Task.Delay(5000);
        }
    }

    static async Task RunHttpTelemetryLoop() {
        while (true) {
            try { 
                string data = PrepareTelemetryJson();
                using (var client = new WebClient()) {
                    client.Encoding = Encoding.UTF8;
                    client.Headers[HttpRequestHeader.ContentType] = "application/json";
                    client.Headers[HttpRequestHeader.UserAgent] = "RustDeskRMM-Agent";
                    // SSL bypass zaten Main'de set edildi
                    client.UploadString(ApiServer + "/api/sysinfo", "POST", data);
                }
                Log("HTTP Telemetri gonderildi.");
            } catch (Exception ex) { Log("HTTP Telemetri hatasi: " + ex.Message); }
            await Task.Delay(60000); // 1 dakika
        }
    }

    static async Task ConnectAndRun() {
        using (var ws = new ClientWebSocket()) {
            string hostname = Environment.MachineName;
            string uri = WsUrl + "?deviceId=" + DeviceId
                       + "&hostname=" + Uri.EscapeDataString(hostname)
                       + "&type=agent&version=" + AgentVersion;

            Log("Baglaniyor: " + WsUrl);
            await ws.ConnectAsync(new Uri(uri), CancellationToken.None);
            Log("WebSocket baglandi!");

            // Ilk telemetri aninda gonder
            await SendTelemetry(ws);

            var cts = new CancellationTokenSource();

            // Telemetri timer (her 60s)
            var telTask = Task.Run(async () => {
                while (!cts.IsCancellationRequested) {
                    await Task.Delay(60000);
                    if (ws.State == WebSocketState.Open)
                        try { await SendTelemetry(ws); } catch {}
                }
            });

            // Heartbeat timer (her 30s)
            var hbTask = Task.Run(async () => {
                while (!cts.IsCancellationRequested) {
                    await Task.Delay(30000);
                    if (ws.State == WebSocketState.Open) {
                        try {
                            string hb = "{"
                                + "\"type\":\"heartbeat\","
                                + "\"deviceId\":\"" + DeviceId + "\","
                                + "\"hostname\":\"" + Esc(hostname) + "\""
                                + "}";
                            await WsSend(ws, hb);
                        } catch {}
                    }
                }
            });

            // Mesaj alma dongusu
            byte[] buf = new byte[65536];
            while (ws.State == WebSocketState.Open) {
                WebSocketReceiveResult res;
                try {
                    res = await ws.ReceiveAsync(new ArraySegment<byte>(buf), CancellationToken.None);
                } catch { break; }

                if (res.MessageType == WebSocketMessageType.Close) {
                    await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None);
                    break;
                }

                string raw = Encoding.UTF8.GetString(buf, 0, res.Count);
                Log("Gelen: " + raw.Substring(0, Math.Min(120, raw.Length)));
                var _ = Task.Run(() => HandleMessage(ws, raw));
            }

            cts.Cancel();
            Log("Baglanti kapandi. 5s sonra yeniden denenecek.");
        }
    }

    static async Task SendTelemetry(ClientWebSocket ws) {
        try {
            string data = PrepareTelemetryJson();
            string msg = "{\"type\":\"telemetry\",\"deviceId\":\"" + DeviceId + "\",\"data\":" + data + "}";
            await WsSend(ws, msg);
            Log("WS Telemetri gonderildi.");
        } catch (Exception ex) { Log("WS Telemetri hatasi: " + ex.Message); }
    }

    static string PrepareTelemetryJson() {
        string hostname = Environment.MachineName;

        // OS
        string osName   = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName",       "Windows") ?? "Windows";
        string osBuild  = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuildNumber", "")       ?? "";
        string cpu      = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\HARDWARE\DESCRIPTION\System\CentralProcessor\0", "ProcessorNameString", "")    ?? "";

        // WMI
        string serial  = Wmi("Win32_BIOS",            "SerialNumber");
        string mfr     = Wmi("Win32_ComputerSystem",  "Manufacturer");
        string model   = Wmi("Win32_ComputerSystem",  "Model");
        string rawRam  = Wmi("Win32_ComputerSystem",  "TotalPhysicalMemory");
        string pcType  = Wmi("Win32_ComputerSystem",  "PCSystemType");

        string formFactor = pcType == "1" ? "Desktop" : pcType == "2" ? "Laptop/Mobile" : "PC";
        string adDomain   = Environment.UserDomainName;

        // RAM
        string ram = "-";
        try { ram = string.Format("{0:N1} GB", long.Parse(rawRam) / 1073741824.0); } catch {}

        // Disk C:
        string disk = "-";
        try {
            var c = new DriveInfo("C");
            disk = string.Format("{0:N1} GB / {1:N1} GB",
                c.AvailableFreeSpace / 1073741824.0, c.TotalSize / 1073741824.0);
        } catch {}

        // Boot time
        string bootTime = "-";
        try {
            bootTime = (DateTime.Now - TimeSpan.FromMilliseconds((long)GetTickCount64()))
                       .ToString("yyyy/MM/dd HH:mm:ss");
        } catch {}

        // Network kartlari
        var cards = new List<string>();
        string myIp = "-";
        foreach (var ni in NetworkInterface.GetAllNetworkInterfaces()) {
            if (ni.OperationalStatus != OperationalStatus.Up) continue;
            if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;

            string mac = ni.GetPhysicalAddress().ToString();
            if (mac.Length == 12)
                mac = mac.Substring(0,2)+":"+mac.Substring(2,2)+":"+mac.Substring(4,2)+":"
                    + mac.Substring(6,2)+":"+mac.Substring(8,2)+":"+mac.Substring(10,2);

            long speed = ni.Speed > 0 ? ni.Speed / 1000000 : 0;

            foreach (var ua in ni.GetIPProperties().UnicastAddresses) {
                if (ua.Address.AddressFamily != System.Net.Sockets.AddressFamily.InterNetwork) continue;
                string ip   = ua.Address.ToString();
                string mask = ua.IPv4Mask != null ? ua.IPv4Mask.ToString() : "-";
                var gwList  = ni.GetIPProperties().GatewayAddresses;
                string gw   = gwList.Count > 0 ? gwList[0].Address.ToString() : "-";

                if (myIp == "-") myIp = ip;

                cards.Add("{"
                    + "\"name\":\""  + Esc(ni.Name) + "\","
                    + "\"ip\":\""    + ip   + "\","
                    + "\"mask\":\""  + mask + "\","
                    + "\"gw\":\""    + gw   + "\","
                    + "\"mac\":\""   + mac  + "\","
                    + "\"speed\":\"" + speed + "\""
                    + "}");
            }
        }

        return "{"
            + "\"id\":\""            + DeviceId          + "\","
            + "\"hostname\":\""      + Esc(hostname)     + "\","
            + "\"os\":\""            + Esc(osName)       + "\","
            + "\"osName\":\""        + Esc(osName)       + "\","
            + "\"osBuild\":\""       + Esc(osBuild)      + "\","
            + "\"processor\":\""     + Esc(cpu)          + "\","
            + "\"cpu\":\""           + Esc(cpu)          + "\","
            + "\"ram\":\""           + Esc(ram)          + "\","
            + "\"disk\":\""          + Esc(disk)         + "\","
            + "\"ip\":\""            + myIp              + "\","
            + "\"serialNumber\":\""  + Esc(serial)       + "\","
            + "\"manufacturer\":\""  + Esc(mfr)          + "\","
            + "\"model\":\""         + Esc(model)        + "\","
            + "\"formFactor\":\""    + Esc(formFactor)   + "\","
            + "\"bootTime\":\""      + bootTime          + "\","
            + "\"adDomain\":\""      + Esc(adDomain)     + "\","
            + "\"agentVersion\":\""  + AgentVersion      + "\","
            + "\"net_details\":["    + string.Join(",", cards.ToArray()) + "]"
            + "}";
    }

    static async Task HandleMessage(ClientWebSocket ws, string json) {
        try {
            string action = Val(json, "action");
            string cmd    = Val(json, "command");
            Log("Komut: action=" + action);

            switch (action) {
                case "lock":
                    LockWorkStation();
                    break;

                case "shutdown":
                    Process.Start("shutdown", "/s /t 5 /f");
                    break;

                case "restart":
                    Process.Start("shutdown", "/r /t 5 /f");
                    break;

                case "update": {
                    string ps = "iex ((New-Object System.Net.WebClient).DownloadString('"
                              + ApiServer + "/api/agent/setup'))";
                    var psi = new ProcessStartInfo("powershell.exe",
                        "-WindowStyle Hidden -ExecutionPolicy Bypass -Command " + ps) {
                        CreateNoWindow = true, UseShellExecute = false
                    };
                    Process.Start(psi);
                    Environment.Exit(0);
                    break;
                }

                case "terminal": {
                    if (string.IsNullOrEmpty(cmd)) break;
                    var psi = new ProcessStartInfo("cmd.exe", "/c " + cmd) {
                        RedirectStandardOutput = true,
                        RedirectStandardError  = true,
                        UseShellExecute        = false,
                        CreateNoWindow         = true
                    };
                    var p = Process.Start(psi);
                    string output = p.StandardOutput.ReadToEnd()
                                  + p.StandardError.ReadToEnd();
                    p.WaitForExit();

                    string b64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(output));
                    string result = "{"
                        + "\"type\":\"result\","
                        + "\"action\":\"terminal\","
                        + "\"deviceId\":\"" + DeviceId      + "\","
                        + "\"command\":\""  + Esc(cmd)      + "\","
                        + "\"output\":\""   + b64           + "\","
                        + "\"isBase64\":true"
                        + "}";

                    if (ws.State == WebSocketState.Open) await WsSend(ws, result);
                    break;
                }
            }
        } catch (Exception ex) {
            Log("HandleMessage hatasi: " + ex.Message);
        }
    }

    static async Task WsSend(ClientWebSocket ws, string msg) {
        byte[] bytes = Encoding.UTF8.GetBytes(msg);
        await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
    }

    // Basit JSON string deger cikarici (kutuphane kullanmadan)
    static string Val(string json, string key) {
        string needle = "\"" + key + "\":\"";
        int i = json.IndexOf(needle);
        if (i < 0) return "";
        i += needle.Length;
        int end = json.IndexOf("\"", i);
        return end < 0 ? "" : json.Substring(i, end - i);
    }

    static string Esc(string s) {
        if (string.IsNullOrEmpty(s)) return s;
        return s.Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\n", "\\n")
                .Replace("\r", "\\r")
                .Replace("\t", "\\t");
    }
}
"@

# --- 4. DERLEME ---------------------------------------------------------------
Write-Host ">> Agent derleniyor..." -ForegroundColor Cyan
$source | Out-File -FilePath "$dir\Agent.cs" -Encoding utf8 -Force

$csc = (Get-ChildItem "C:\Windows\Microsoft.NET\Framework64\v4.0.*\csc.exe" -ErrorAction SilentlyContinue |
        Select-Object -First 1).FullName

if (-not $csc) {
    Write-Error "csc.exe bulunamadi. .NET Framework 4.5+ kurulu olmali."
    return
}

Stop-Process -Name "RustDeskRMM" -Force -ErrorAction SilentlyContinue

& $csc /out:"$dir\RustDeskRMM.exe" `
       /target:winexe `
       /reference:System.Management.dll `
       /reference:System.dll `
       /reference:System.Net.dll `
       "$dir\Agent.cs" | Out-Null

if (-not (Test-Path "$dir\RustDeskRMM.exe")) {
    Write-Error "Derleme basarisiz — Agent.cs hatalarini kontrol edin."
    return
}
Write-Host "[OK] Derleme tamamlandi." -ForegroundColor Green

# --- 5. ZAMANLANMIS GOREV OLARAK KAYIT ----------------------------------------
Write-Host ">> Zamanlanmis gorev kaydediliyor..." -ForegroundColor Cyan

$taskName  = "RustDeskRMM_Service"
$action    = New-ScheduledTaskAction -Execute "$dir\RustDeskRMM.exe"
$trigger   = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$settings  = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
    -Principal $principal -Settings $settings -Force | Out-Null

Start-ScheduledTask -TaskName $taskName
Write-Host "[OK] RustDesk RMM Agent V3 kuruldu ve baslatildi!" -ForegroundColor Green
Write-Host "    API  : $apiServer" -ForegroundColor White
Write-Host "    WS   : $wsUrl"     -ForegroundColor White
Write-Host "    ID   : $rdId"      -ForegroundColor Yellow
