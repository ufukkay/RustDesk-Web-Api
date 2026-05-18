
# --- KONFIGURASYON ---
$dir           = "C:\ProgramData\RustDeskRMM"
$apiServer     = "https://rmm.talay.com"
$wsUrl         = "wss://rmm.talay.com/agent-socket"
$agentApiKey   = "AGENT_API_KEY_PLACEHOLDER"
$taskName      = "RustDeskRMM"
$logFile       = "$dir\setup.log"

# Proje dizinini en başta oluşturalım ki log yazabilelim
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

function Write-Step ([int]$step, [string]$msg) {
    $formatted = "[$step/5] $msg..."
    Write-Host $formatted -ForegroundColor Cyan
    try {
        $logMsg = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [STEP $step] $msg"
        Add-Content -Path $logFile -Value $logMsg -ErrorAction SilentlyContinue
    } catch {}
}

function Report-Error ([string]$msg) {
    Write-Host "`n[!] HATA: $msg" -ForegroundColor Red
    try {
        $logMsg = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [CRITICAL HATA] $msg"
        Add-Content -Path $logFile -Value $logMsg -ErrorAction SilentlyContinue
    } catch {}
    try {
        $body = @{ id = $env:COMPUTERNAME; error = $msg; step = "setup" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$apiServer/api/agent/log" -Method Post -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue
    } catch {}
    exit 1
}

# --- 1. HAZIRLIK VE ADMIN ---
try {
    $initMsg = "`n$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') === TALAY RMM PRO KURULUM BASLADI ==="
    Add-Content -Path $logFile -Value $initMsg -ErrorAction SilentlyContinue
} catch {}

Write-Step 1 "Sistem gereksinimleri kontrol ediliyor"

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (!$isAdmin) { Report-Error "Kurulum için Administrator yetkisi gereklidir." }

# --- 2. ESKI SURUM TEMIZLIGI (HARD RESET) ---
Write-Step 2 "Eski versiyon kalıntıları temizleniyor"
try {
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    }
    Stop-Process -Name "Agent" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} catch {
    Write-Host "Temizlik sırasında ufak bir sorun oluştu, devam ediliyor..." -ForegroundColor Yellow
}

# --- 3. CIHAZ ID VE RUSTDESK ---
Write-Step 3 "RustDesk yapılandırması taranıyor"
$rdId = ""
$rdExe = if (Test-Path "C:\Program Files\RustDesk\rustdesk.exe") { "C:\Program Files\RustDesk\rustdesk.exe" } else { "C:\Program Files (x86)\RustDesk\rustdesk.exe" }
if (Test-Path $rdExe) {
    try { $rdId = (& $rdExe --get-id 2>$null).Trim() } catch {}
}

if (!$rdId) {
    $configPaths = @(
        "C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\rustdesk.toml",
        "$env:AppData\RustDesk\config\rustdesk.toml"
    )
    foreach ($p in $configPaths) {
        if (!$rdId -and (Test-Path $p)) {
            if ($lines = Get-Content $p -ErrorAction SilentlyContinue) {
                foreach ($line in $lines) {
                    if ($line -match "^id = '([^']+)'") { 
                        $rdId = $matches[1]
                        break
                    }
                }
            }
        }
    }
}
if (!$rdId) { $rdId = $env:COMPUTERNAME }

# --- 4. AJAN DERLEME (v1.1-Beta) ---
Write-Step 4 "Pro-Agent derleniyor (v1.1-Beta)"

$source = @"
using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;
using System.IO;
using Microsoft.Win32;
using System.Management;
using System.Net.WebSockets;
using System.Collections.Generic;

public class RustDeskAgent {
    static string DeviceId    = "$rdId"; 
    const string WsUrl        = "$wsUrl";
    const string ApiServer    = "$apiServer";
    const string AgentVersion = "v1.1-Beta";
    const string ApiKey       = "$agentApiKey";
    static readonly string LogPath = @"$dir\agent.log";

    static string SProcessor = "-", SSerial = "-", SManufacturer = "-", SModel = "-";
    static string SOsName = "-", SOsBuild = "-", SBootTime = "-", SNetDetails = "[]", SRam = "-";
    static DateTime SRefreshTime = DateTime.MinValue;

    static string UpdateCount = "-";
    static DateTime UpdateCheckTime = DateTime.MinValue;
    static int WsBackoff = 10000;

    static string LastError = "-";
    static void Log(string m) { 
        try { 
            File.AppendAllText(LogPath, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " [AGENT] " + m + Environment.NewLine); 
            if (m.ToUpper().Contains("ERROR") || m.ToUpper().Contains("FAIL")) LastError = m;
        } catch {} 
    }

    static string GetRuntimeId() {
        try {
            string rd = @"C:\Program Files\RustDesk\rustdesk.exe";
            if (!File.Exists(rd)) rd = @"C:\Program Files (x86)\RustDesk\rustdesk.exe";
            if (File.Exists(rd)) {
                ProcessStartInfo psi = new ProcessStartInfo(rd, "--get-id");
                psi.RedirectStandardOutput = true;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                Process p = Process.Start(psi);
                string id = p.StandardOutput.ReadToEnd().Trim();
                p.WaitForExit();
                if (!string.IsNullOrEmpty(id) && id.Length >= 5) return id;
            }
        } catch {}

        try {
            string[] paths = { 
                @"C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\rustdesk.toml",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"RustDesk\config\rustdesk.toml")
            };
            foreach (var p in paths) {
                if (File.Exists(p)) {
                    string[] lines = File.ReadAllLines(p);
                    foreach (string line in lines) {
                        if (line.StartsWith("id = '")) {
                            int start = 6;
                            int end = line.IndexOf("'", start);
                            if (end > start) return line.Substring(start, end - start);
                        }
                    }
                }
            }
        } catch {}
        return "$rdId"; 
    }

    static string EscJ(string s) {
        if (s == null) return "";
        return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", "").Replace("\t", " ").Trim();
    }

    static string Wmi(string cls, string prop) {
        try {
            using (ManagementObjectSearcher s = new ManagementObjectSearcher("SELECT " + prop + " FROM " + cls)) {
                foreach (ManagementObject o in s.Get()) {
                    if (o[prop] != null) return o[prop].ToString().Trim();
                }
            }
        } catch {}
        return "-";
    }

    static void RefreshStatic() {
        if ((DateTime.Now - SRefreshTime).TotalMinutes < 30) return;
        SRefreshTime = DateTime.Now;
        SProcessor    = EscJ(Wmi("Win32_Processor", "Name"));
        SSerial       = EscJ(Wmi("Win32_BIOS", "SerialNumber"));
        SManufacturer = EscJ(Wmi("Win32_ComputerSystem", "Manufacturer"));
        SModel        = EscJ(Wmi("Win32_ComputerSystem", "Model"));
        
        string rawOs = "-";
        try {
            object val = Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName", "-");
            if (val != null) rawOs = val.ToString();
        } catch {}
        
        string rawBld = "-";
        try {
            object val = Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuildNumber", "-");
            if (val != null) rawBld = val.ToString();
        } catch {}
        
        int bldNum = 0;
        if (rawBld != "-" && int.TryParse(rawBld, out bldNum) && bldNum >= 22000 && rawOs.Contains("Windows 10")) {
            rawOs = rawOs.Replace("Windows 10", "Windows 11");
        }
        SOsName  = EscJ(rawOs);
        SOsBuild = rawBld;
        
        try {
            string bootRaw = Wmi("Win32_OperatingSystem", "LastBootUpTime");
            if (bootRaw != "-") SBootTime = ManagementDateTimeConverter.ToDateTime(bootRaw).ToString("yyyy-MM-dd HH:mm");
            else SBootTime = "-";
        } catch { SBootTime = "-"; }
        
        string ramRaw = Wmi("Win32_ComputerSystem", "TotalPhysicalMemory");
        try {
            if (ramRaw != "-") SRam = string.Format("{0:N1} GB", long.Parse(ramRaw) / 1073741824.0);
            else SRam = "-";
        } catch { SRam = "-"; }
        
        SNetDetails = BuildNetDetails();
    }

    static string BuildNetDetails() {
        StringBuilder sb = new StringBuilder("[");
        bool first = true;
        try {
            using (ManagementObjectSearcher s = new ManagementObjectSearcher("SELECT Description,IPAddress,IPSubnet,DefaultIPGateway,MACAddress FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled=True")) {
                foreach (ManagementObject o in s.Get()) {
                    string[] ips = o["IPAddress"] as string[];
                    string[] mks = o["IPSubnet"] as string[];
                    string[] gws = o["DefaultIPGateway"] as string[];
                    string ip = (ips != null && ips.Length > 0) ? ips[0] : "";
                    if (ip.Contains(":")) continue;
                    string mk = (mks != null && mks.Length > 0) ? mks[0] : "";
                    string gw = (gws != null && gws.Length > 0) ? gws[0] : "";
                    string mac = (o["MACAddress"] != null) ? o["MACAddress"].ToString() : "";
                    string name = (o["Description"] != null) ? EscJ(o["Description"].ToString()) : "";
                    if (!first) sb.Append(",");
                    sb.Append("{\"name\":\"" + name + "\",\"ip\":\"" + ip + "\",\"mask\":\"" + mk + "\",\"gw\":\"" + gw + "\",\"mac\":\"" + mac + "\"}");
                    first = false;
                }
            }
        } catch {}
        sb.Append("]");
        return sb.ToString();
    }

    static string GetCurrentUser() {
        try {
            string user = Wmi("Win32_ComputerSystem", "UserName");
            if (user != "-" && !string.IsNullOrEmpty(user)) return user;
            using (ManagementObjectSearcher s = new ManagementObjectSearcher("SELECT * FROM Win32_Process WHERE Name='explorer.exe'")) {
                foreach (ManagementObject o in s.Get()) {
                    string[] ownerArgs = new string[] { "", "" };
                    if (Convert.ToInt32(o.InvokeMethod("GetOwner", ownerArgs)) == 0) {
                        return ownerArgs[1] + "\\" + ownerArgs[0];
                    }
                }
            }
        } catch {}
        return "-";
    }

    static string BuildJson() {
        RefreshStatic();
        string cpuUsage = Wmi("Win32_Processor", "LoadPercentage");
        string ramUsage = "-";
        try {
            long free  = long.Parse(Wmi("Win32_OperatingSystem", "FreePhysicalMemory"));
            long total = long.Parse(Wmi("Win32_OperatingSystem", "TotalVisibleMemorySize"));
            ramUsage   = ((double)(total - free) / total * 100).ToString("F1");
        } catch {}
        
        string disk = "-";
        try {
            StringBuilder sb = new StringBuilder();
            foreach (DriveInfo d in DriveInfo.GetDrives()) {
                if (!d.IsReady || d.DriveType != DriveType.Fixed) continue;
                if (sb.Length > 0) sb.Append(" | ");
                sb.Append(d.Name.Replace("\\","").Replace(":","") + ": " + string.Format("{0:N1}/{1:N1} GB", d.AvailableFreeSpace / 1073741824.0, d.TotalSize / 1073741824.0));
            }
            if (sb.Length > 0) disk = sb.ToString();
        } catch {}
        
        string user = GetCurrentUser();
        
        if ((DateTime.Now - UpdateCheckTime).TotalHours >= 6) {
            UpdateCheckTime = DateTime.Now;
            Task.Run(() => {
                try {
                    dynamic searcher = Activator.CreateInstance(Type.GetTypeFromProgID("Microsoft.Update.Searcher"));
                    UpdateCount = searcher.Search("IsInstalled=0 and Type='Software'").Updates.Count.ToString();
                } catch { UpdateCount = "0"; }
            });
        }
        
        return "{" +
            "\"id\":\"" + DeviceId + "\"," +
            "\"hostname\":\"" + EscJ(Environment.MachineName) + "\"," +
            "\"user\":\"" + EscJ(user) + "\"," +
            "\"processor\":\"" + SProcessor + "\"," +
            "\"ram\":\"" + SRam + "\"," +
            "\"disk\":\"" + EscJ(disk) + "\"," +
            "\"cpuUsage\":\"" + cpuUsage + "\"," +
            "\"ramUsage\":\"" + ramUsage + "\"," +
            "\"osName\":\"" + SOsName + "\"," +
            "\"osBuild\":\"" + SOsBuild + "\"," +
            "\"bootTime\":\"" + SBootTime + "\"," +
            "\"serialNumber\":\"" + SSerial + "\"," +
            "\"manufacturer\":\"" + SManufacturer + "\"," +
            "\"model\":\"" + SModel + "\"," +
            "\"agentVersion\":\"" + AgentVersion + "\"," +
            "\"pendingUpdates\":\"" + UpdateCount + "\"," +
            "\"lastError\":\"" + EscJ(LastError) + "\"," +
            "\"net_details\":" + SNetDetails +
        "}";
    }

    static async Task Send(ClientWebSocket ws, string m) {
        if (ws.State != WebSocketState.Open) return;
        byte[] b = Encoding.UTF8.GetBytes(m);
        await ws.SendAsync(new ArraySegment<byte>(b), WebSocketMessageType.Text, true, CancellationToken.None);
    }

    static string GetVal(string j, string k) {
        string n = "\"" + k + "\":\"";
        int i = j.IndexOf(n);
        if (i < 0) return "";
        i += n.Length;
        int e = i;
        while (e < j.Length) {
            int nextQuote = j.IndexOf("\"", e);
            if (nextQuote < 0) return "";
            int backslashes = 0;
            int temp = nextQuote - 1;
            while (temp >= i && j[temp] == '\\') {
                backslashes++;
                temp--;
            }
            if (backslashes % 2 == 0) {
                string val = j.Substring(i, nextQuote - i);
                return val.Replace("\\\"", "\"").Replace("\\\\", "\\").Replace("\\/", "/");
            }
            e = nextQuote + 1;
        }
        return "";
    }

    [System.Runtime.InteropServices.DllImport("kernel32.dll")]
    static extern uint WTSGetActiveConsoleSessionId();

    static string GetSystem32Path(string exe) {
        try {
            string win = Environment.GetFolderPath(Environment.SpecialFolder.Windows);
            string sysnative = Path.Combine(win, "sysnative");
            if (Directory.Exists(sysnative)) return Path.Combine(sysnative, exe);
        } catch {}
        return exe;
    }

    static void Exec(string c) {
        try {
            ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + c);
            psi.WindowStyle = ProcessWindowStyle.Hidden;
            psi.CreateNoWindow = true;
            psi.UseShellExecute = false;
            Process.Start(psi);
        } catch (Exception ex) { Log("Exec Error: " + ex.Message); }
    }

    static async Task Handle(ClientWebSocket ws, string j) {
        try {
            string a = GetVal(j, "action");
            if (string.IsNullOrEmpty(a)) return;
            Log("COMMAND RECEIVED: " + a);
            
            if (a == "lock") {
                uint sessId = WTSGetActiveConsoleSessionId();
                if (sessId != 0xFFFFFFFF) {
                    Exec("\"" + GetSystem32Path("tsdiscon.exe") + "\" " + sessId);
                } else {
                    Exec("\"" + GetSystem32Path("tsdiscon.exe") + "\" 1");
                    Exec("\"" + GetSystem32Path("tsdiscon.exe") + "\" 2");
                }
            }
            else if (a == "restart") Exec("\"" + GetSystem32Path("shutdown.exe") + "\" /r /t 2 /f");
            else if (a == "shutdown") Exec("\"" + GetSystem32Path("shutdown.exe") + "\" /s /t 2 /f");
            else if (a == "update") Exec("powershell -ExecutionPolicy Bypass -Command \"iwr -useb " + ApiServer + "/api/agent/setup | iex\"");
            else if (a == "terminal") {
                string c = GetVal(j, "command");
                ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + c);
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                Process p = Process.Start(psi);
                string o = p.StandardOutput.ReadToEnd() + p.StandardError.ReadToEnd();
                p.WaitForExit();
                await Send(ws, "{\"type\":\"result\",\"deviceId\":\"" + DeviceId + "\",\"output\":\"" + Convert.ToBase64String(Encoding.UTF8.GetBytes(o)) + "\",\"isBase64\":true}");
            }
        } catch (Exception ex) { Log("Handle Error: " + ex.Message); }
    }

    static async Task Connect() {
        DeviceId = GetRuntimeId(); 
        using (ClientWebSocket ws = new ClientWebSocket()) {
            string q = "?deviceId=" + DeviceId + "&hostname=" + Uri.EscapeDataString(Environment.MachineName) + "&type=agent&key=" + ApiKey;
            Log("Connecting to WS: " + WsUrl + "?deviceId=" + DeviceId);
            try {
                await ws.ConnectAsync(new Uri(WsUrl + q), CancellationToken.None);
                WsBackoff = 10000;
            } catch (Exception ex) {
                Log("CRITICAL WS CONN ERROR: " + ex.Message);
                throw;
            }
            Log("WS Connected successfully.");
            await Send(ws, "{\"type\":\"telemetry\",\"deviceId\":\"" + DeviceId + "\",\"data\":" + BuildJson() + "}");
            
            CancellationTokenSource cts = new CancellationTokenSource();
            Task heartbeatTask = Task.Run(async () => {
                while (!cts.IsCancellationRequested && ws.State == WebSocketState.Open) {
                    try {
                        await Task.Delay(30000, cts.Token);
                        await Send(ws, "{\"type\":\"heartbeat\",\"deviceId\":\"" + DeviceId + "\"}");
                    } catch { break; }
                }
            });
            
            try {
                byte[] b = new byte[65536];
                while (ws.State == WebSocketState.Open) {
                    using (MemoryStream ms = new MemoryStream()) {
                        WebSocketReceiveResult r;
                        do {
                            r = await ws.ReceiveAsync(new ArraySegment<byte>(b), CancellationToken.None);
                            if (r.MessageType == WebSocketMessageType.Close) break;
                            ms.Write(b, 0, r.Count);
                        } while (!r.EndOfMessage);
                        if (r.MessageType == WebSocketMessageType.Close) break;
                        string msg = Encoding.UTF8.GetString(ms.ToArray());
                        await Handle(ws, msg);
                    }
                }
            } finally {
                cts.Cancel();
                Log("WS Disconnected.");
            }
        }
    }

    public static void Main() {
        Log("Agent started " + AgentVersion);
        ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
        ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
        
        Task.Run(async () => {
            while (true) {
                try {
                    DeviceId = GetRuntimeId(); 
                    using (WebClient c = new WebClient()) {
                        c.Encoding = Encoding.UTF8;
                        c.Headers["Content-Type"] = "application/json";
                        if (!string.IsNullOrEmpty(ApiKey)) c.Headers["Authorization"] = "Bearer " + ApiKey;
                        c.UploadString(ApiServer + "/api/sysinfo", "POST", BuildJson());
                    }
                } catch {}
                await Task.Delay(300000);
            }
        });
        
        while (true) {
            try { Connect().GetAwaiter().GetResult(); } 
            catch (Exception ex) { Log("WS Main Loop Error: " + ex.Message); }
            Thread.Sleep(WsBackoff);
            WsBackoff = Math.Min(WsBackoff * 2, 300000);
        }
    }
}
"@

$source | Out-File -FilePath "$dir\Agent.cs" -Encoding utf8
$cscPaths = Get-ChildItem "C:\Windows\Microsoft.NET\Framework*\v4.0.*\csc.exe" -ErrorAction SilentlyContinue
$csc = ($cscPaths | Select-Object -Last 1).FullName
if (!$csc) { Report-Error ".NET Compiler (csc.exe) bulunamadı." }

$refs = @("/reference:System.Management.dll", "/reference:Microsoft.CSharp.dll", "/reference:System.dll", "/reference:System.Core.dll")
$buildArgs = "/target:exe /out:`"$dir\Agent.exe`" " + ($refs -join " ") + " `"$dir\Agent.cs`""

$process = Start-Process -FilePath $csc -ArgumentList $buildArgs -Wait -NoNewWindow -PassThru -RedirectStandardOutput "$dir\build.log" -RedirectStandardError "$dir\build_err.log"
if ($process.ExitCode -ne 0) {
    $errText = Get-Content "$dir\build_err.log" -Raw
    Report-Error "Ajan derlenemedi. Detay: $errText"
}

# --- 5. GOREV ZAMANLAYICI VE BASLATMA ---
Write-Step 5 "Ajan servisi başlatılıyor"

try {
    $action = New-ScheduledTaskAction -Execute "$dir\Agent.exe"
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $settingsSet = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 0)
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settingsSet -Force | Out-Null
    Start-ScheduledTask -TaskName $taskName
    
    try {
        $successMsg = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [SUCCESS] Kurulum başarıyla tamamlandı. Cihaz ID: $rdId"
        Add-Content -Path $logFile -Value $successMsg -ErrorAction SilentlyContinue
    } catch {}
    
    Write-Host "`n------------------------------------------------" -ForegroundColor Gray
    Write-Host "ISLEM TAMAMLANDI: Talay RMM Pro Ajanı Hazır! ✅" -ForegroundColor Green
    Write-Host "Cihaz ID: $rdId" -ForegroundColor Yellow
    Write-Host "------------------------------------------------`n" -ForegroundColor Gray
} catch {
    Report-Error "Servis kaydı sırasında hata oluştu: $($_.Exception.Message)"
}
