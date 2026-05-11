# --- RUSTDESK RMM SÜPER AJAN (AGENT V2) INSTALLER ---
# Bu scripti hedef Windows makinede Yonetici olarak calistirin.

$dir = "C:\ProgramData\RustDeskRMM"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }

# 1. RUSTDESK ID TESPITI
$rdId = ""
$possiblePaths = @(
    "$env:ProgramData\RustDesk\config\RustDesk.toml",
    "C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\RustDesk.toml",
    "$env:AppData\RustDesk\config\RustDesk.toml"
)
foreach ($p in $possiblePaths) {
    if (Test-Path $p) {
        $content = Get-Content $p -Raw
        if ($content -match 'id\s*=\s*''?(\d+)''?') { 
            $rdId = $matches[1]
            Write-Host "RustDesk ID bulundu: $rdId ($p)" -ForegroundColor Cyan
            break 
        }
    }
}

if (-not $rdId) { $rdId = Read-Host "RustDesk ID otomatik bulunamadi, lutfen elle girin" }
if (-not $rdId) { Write-Error "ID olmadan devam edilemez!"; return }

# 2. C# AGENT KAYNAK KODU (AGENT V2 - WEBSOCKETS)
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
    [DllImport("user32.dll")] public static extern bool LockWorkStation();

    public static string GetWmi(string wclass, string prop) {
        try {
            using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT " + prop + " FROM " + wclass)) {
                foreach (ManagementObject obj in searcher.Get()) {
                    if (obj[prop] != null) return obj[prop].ToString().Trim();
                }
            }
        } catch { }
        return "";
    }

    public static void Main() {
        ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; // TLS 1.2
        RunAgentAsync().Wait();
    }
    
    private static async Task RunAgentAsync() {
        string sysinfoUrl = "https://rmm.talay.com/api/sysinfo";
        string wsUrl = "wss://rmm.talay.com/agent-socket";
        string deviceId = "$rdId"; 
        string agentVersion = "v2.0.0";
        string hostname = Environment.MachineName;

        // Telemetry Thread (Her 60 saniyede bir merkeze donanım bilgisini HTTP POST ile yollar)
        Thread t = new Thread(() => {
            while (true) {
                try { SendTelemetry(sysinfoUrl, deviceId, agentVersion); } catch { }
                Thread.Sleep(60000); 
            }
        });
        t.IsBackground = true;
        t.Start();

        // WebSocket Loop (Gerçek Zamanlı İletişim İçin)
        while (true) {
            try {
                using (ClientWebSocket ws = new ClientWebSocket()) {
                    string wsUriStr = wsUrl + "?deviceId=" + deviceId + "&hostname=" + hostname + "&type=agent";
                    await ws.ConnectAsync(new Uri(wsUriStr), CancellationToken.None);
                    
                    byte[] buffer = new byte[8192];
                    while (ws.State == WebSocketState.Open) {
                        WebSocketReceiveResult result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                        if (result.MessageType == WebSocketMessageType.Close) {
                            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, string.Empty, CancellationToken.None);
                        } else {
                            string msg = Encoding.UTF8.GetString(buffer, 0, result.Count);
                            // Komutu arka planda işle (Fire and forget)
                            var _ = Task.Run(() => ProcessCommand(msg, ws, deviceId));
                        }
                    }
                }
            } catch { }
            // Bağlantı koparsa 5 saniye bekle ve yeniden bağlan
            await Task.Delay(5000);
        }
    }
    
    private static async Task ProcessCommand(string msg, ClientWebSocket ws, string deviceId) {
        try {
            string action = ExtractJsonValue(msg, "action");
            string cmd = ExtractJsonValue(msg, "command");

            if (action == "lock") LockWorkStation();
            else if (action == "shutdown") Process.Start("shutdown", "/s /t 0 /f");
            else if (action == "restart") Process.Start("shutdown", "/r /t 0 /f");
            else if (action == "update") {
                // Sessiz Ajan Güncellemesi
                string ps1 = "iex ((New-Object System.Net.WebClient).DownloadString('https://rmm.talay.com/api/agent/setup'))";
                ProcessStartInfo psi = new ProcessStartInfo("powershell.exe", "-WindowStyle Hidden -Command \"\"" + ps1 + "\"\"") { CreateNoWindow = true, UseShellExecute = false };
                Process.Start(psi);
                Environment.Exit(0);
            }
            else if (action == "terminal" && !string.IsNullOrEmpty(cmd)) {
                // Terminal Komutu Çalıştırma (Sıfır Gecikme)
                ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + cmd) { RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false, CreateNoWindow = true };
                var p = Process.Start(psi);
                string output = p.StandardOutput.ReadToEnd();
                output += p.StandardError.ReadToEnd();
                p.WaitForExit();
                
                string b64Output = Convert.ToBase64String(Encoding.UTF8.GetBytes(output));
                string resultBody = "{\"action\":\"terminal\", \"deviceId\":\"" + deviceId + "\", \"command\":\"" + EscapeJson(cmd) + "\", \"output\":\"" + b64Output + "\", \"isBase64\": true}";
                
                byte[] bytes = Encoding.UTF8.GetBytes(resultBody);
                if (ws.State == WebSocketState.Open) {
                    await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
        } catch { }
    }

    private static void SendTelemetry(string serverUrl, string deviceId, string agentVersion) {
        string osName = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName", "Windows") ?? "Windows";
        string osBuild = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuildNumber", "") ?? "";
        string processor = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\HARDWARE\DESCRIPTION\System\CentralProcessor\0", "ProcessorNameString", "") ?? "";
        string adDomain = Environment.UserDomainName;
        
        string serialNumber = GetWmi("Win32_BIOS", "SerialNumber");
        string manufacturer = GetWmi("Win32_ComputerSystem", "Manufacturer");
        string model = GetWmi("Win32_ComputerSystem", "Model");
        string formFactor = GetWmi("Win32_ComputerSystem", "PCSystemType"); 
        if (formFactor == "1") formFactor = "Desktop";
        else if (formFactor == "2") formFactor = "Laptop/Mobile";
        else formFactor = "PC";

        DriveInfo c = new DriveInfo("C");
        string disk = string.Format("{0:N1} GB / {1:N1} GB", c.AvailableFreeSpace / 1073741824.0, c.TotalSize / 1073741824.0);
        
        long uptimeTicks = Environment.TickCount64;
        DateTime bootTimeDt = DateTime.Now - TimeSpan.FromMilliseconds(uptimeTicks);
        string bootTime = bootTimeDt.ToString("yyyy/MM/dd HH:mm:ss");

        List<string> cards = new List<string>();
        foreach (var ni in NetworkInterface.GetAllNetworkInterfaces()) {
            if (ni.OperationalStatus == OperationalStatus.Up && ni.NetworkInterfaceType != NetworkInterfaceType.Loopback) {
                string mac = ni.GetPhysicalAddress().ToString();
                if (mac.Length == 12) {
                    mac = mac.Substring(0,2) + ":" + mac.Substring(2,2) + ":" + mac.Substring(4,2) + ":" + 
                          mac.Substring(6,2) + ":" + mac.Substring(8,2) + ":" + mac.Substring(10,2);
                }
                long speed = ni.Speed / 1000000;
                foreach (var ip in ni.GetIPProperties().UnicastAddresses) {
                    if (ip.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork) {
                        string gw = ni.GetIPProperties().GatewayAddresses.Count > 0 ? ni.GetIPProperties().GatewayAddresses[0].Address.ToString() : "YOK";
                        string mask = ip.IPv4Mask != null ? ip.IPv4Mask.ToString() : "YOK";
                        cards.Add("{\"name\":\"" + EscapeJson(ni.Name) + "\", \"ip\":\"" + ip.Address.ToString() + "\", \"mask\":\"" + mask + "\", \"gw\":\"" + gw + "\", \"mac\":\"" + mac + "\", \"speed\":\"" + speed + "\"}");
                    }
                }
            }
        }
        
        string body = "{\"id\":\"" + deviceId + "\", \"disk\":\"" + disk + "\", \"hostname\":\"" + EscapeJson(Environment.MachineName) + "\", \"os\":\"" + EscapeJson(osName) + "\", \"osName\":\"" + EscapeJson(osName) + "\", \"osBuild\":\"" + EscapeJson(osBuild) + "\", \"processor\":\"" + EscapeJson(processor) + "\", \"adDomain\":\"" + EscapeJson(adDomain) + "\", \"serialNumber\":\"" + EscapeJson(serialNumber) + "\", \"manufacturer\":\"" + EscapeJson(manufacturer) + "\", \"model\":\"" + EscapeJson(model) + "\", \"formFactor\":\"" + EscapeJson(formFactor) + "\", \"bootTime\":\"" + bootTime + "\", \"agentVersion\":\"" + agentVersion + "\", \"network\":[" + string.Join(",", cards.ToArray()) + "]}";
        
        using (WebClient client = new WebClient()) {
            client.Encoding = Encoding.UTF8;
            client.Headers[HttpRequestHeader.ContentType] = "application/json";
            client.UploadString(serverUrl, "POST", body);
        }
    }

    private static string ExtractJsonValue(string json, string key) {
        string search = "\"" + key + "\":\"";
        int idx = json.IndexOf(search);
        if (idx == -1) return "";
        idx += search.Length;
        int endIdx = json.IndexOf("\"", idx);
        if (endIdx == -1) return "";
        return json.Substring(idx, endIdx - idx);
    }
    
    private static string EscapeJson(string s) {
        if (string.IsNullOrEmpty(s)) return s;
        return s.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }
}
"@
$source | Out-File -FilePath "$dir\Agent.cs" -Encoding utf8 -Force

# 3. DERLE VE SERVIS OLARAK AYARLA
$csc = (Get-ChildItem "C:\Windows\Microsoft.NET\Framework64\v4.0.*\csc.exe" | Select-Object -First 1).FullName
Stop-Process -Name "RustDeskRMM" -ErrorAction SilentlyContinue

# ClientWebSocket desteği için System.dll referans veriliyor (mscorlib ve System.dll default olarak eklenir ama garanti ediyoruz)
& $csc /out:"$dir\RustDeskRMM.exe" /target:winexe /reference:System.Management.dll /reference:System.dll "$dir\Agent.cs"

$taskName = "RustDeskRMM_Service"
$action = New-ScheduledTaskAction -Execute "$dir\RustDeskRMM.exe"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
Start-ScheduledTask -TaskName $taskName

Write-Host "RustDesk RMM Super Agent (V2) basariyla kuruldu! ✅" -ForegroundColor Green
