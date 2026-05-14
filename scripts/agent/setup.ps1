<#
.SYNOPSIS
    RustDesk RMM Agent v4.1.2 - C# 5.0 Kesin Uyum
#>

$dir          = "C:\ProgramData\RustDeskRMM"
$apiServer    = "https://rmm.talay.com"
$wsUrl        = "wss://rmm.talay.com/agent-socket"
$agentApiKey  = "AGENT_API_KEY_PLACEHOLDER"

# --- 1. ADMIN VE KLASOR KONTROLU ---
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { exit 1 }
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

# --- 2. CIHAZ ID TESPITI ---
$rdId = ""
$configPaths = @(
    "C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\rustdesk.toml",
    "$env:AppData\RustDesk\config\rustdesk.toml"
)
foreach ($p in $configPaths) {
    if (!$rdId -and (Test-Path $p)) {
        $content = Get-Content $p -Raw
        if ($content -match "id = '([^']+)'") { $rdId = $matches[1] }
    }
}
if (!$rdId) { $rdId = $env:COMPUTERNAME }

# --- 3. C# KAYNAK KODU ---
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
    const string DeviceId     = "$rdId";
    const string WsUrl        = "$wsUrl";
    const string ApiServer    = "$apiServer";
    const string AgentVersion = "v4.1.2";
    const string ApiKey       = "$agentApiKey";
    static readonly string LogPath = @"$dir\agent.log";

    static string SProcessor = "-", SSerial = "-", SManufacturer = "-", SModel = "-";
    static string SOsName = "-", SOsBuild = "-", SBootTime = "-", SNetDetails = "[]", SRam = "-";
    static DateTime SRefreshTime = DateTime.MinValue;

    static string UpdateCount = "-";
    static DateTime UpdateCheckTime = DateTime.MinValue;
    static int WsBackoff = 10000;

    static void Log(string m) { try { File.AppendAllText(LogPath, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " [AGENT] " + m + Environment.NewLine); } catch {} }

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
        
        string user = Wmi("Win32_ComputerSystem", "UserName");
        if (user == "-") {
            try {
                using (ManagementObjectSearcher s = new ManagementObjectSearcher("SELECT * FROM Win32_Process WHERE Name='explorer.exe'")) {
                    foreach (ManagementObject o in s.Get()) {
                        string[] args = new string[] { "", "" };
                        if (Convert.ToInt32(o.InvokeMethod("GetOwner", args)) == 0) {
                            user = args[1] + "\\" + args[0];
                            break;
                        }
                    }
                }
            } catch {}
        }
        
        if ((DateTime.Now - UpdateCheckTime).TotalHours >= 6) {
            UpdateCheckTime = DateTime.Now;
            Task.Run(() => {
                try {
                    dynamic searcher = Activator.CreateInstance(Type.GetTypeFromProgID("Microsoft.Update.Searcher"));
                    UpdateCount = searcher.Search("IsInstalled=0 and Type='Software'").Updates.Count.ToString();
                } catch {
                    UpdateCount = "0";
                }
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
        int e = j.IndexOf("\"", i);
        return e < 0 ? "" : j.Substring(i, e - i);
    }

    static async Task Handle(ClientWebSocket ws, string j) {
        try {
            string a = GetVal(j, "action");
            if (string.IsNullOrEmpty(a)) return;
            Log("Action: " + a);
            if (a == "lock") Process.Start("rundll32.exe", "user32.dll,LockWorkStation");
            else if (a == "restart") Process.Start("shutdown", "/r /t 5 /f");
            else if (a == "shutdown") Process.Start("shutdown", "/s /t 5 /f");
            else if (a == "update") Process.Start("cmd.exe", "/c powershell -ExecutionPolicy Bypass -Command \"iwr -useb " + ApiServer + "/api/agent/setup | iex\"");
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
        using (ClientWebSocket ws = new ClientWebSocket()) {
            string q = "?deviceId=" + DeviceId + "&hostname=" + Uri.EscapeDataString(Environment.MachineName) + "&type=agent";
            Log("Connecting to " + WsUrl);
            await ws.ConnectAsync(new Uri(WsUrl + q), CancellationToken.None);
            WsBackoff = 10000;
            Log("Connected");
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
                Log("Disconnected");
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
            try {
                Connect().GetAwaiter().GetResult();
            } catch (Exception ex) {
                Log("WS Error: " + ex.Message);
            }
            Thread.Sleep(WsBackoff);
            WsBackoff = Math.Min(WsBackoff * 2, 300000);
        }
    }
}
"@

# --- 4. DERLEME ---
$source | Out-File -FilePath "$dir\Agent.cs" -Encoding utf8
$csc = (Get-ChildItem "C:\Windows\Microsoft.NET\Framework*\v4.0.*\csc.exe" -ErrorAction SilentlyContinue | Select-Object -Last 1).FullName
if (!$csc) { Write-Error "csc.exe bulunamadi"; exit 1 }

$refs = @(
    "/reference:System.Management.dll",
    "/reference:Microsoft.CSharp.dll",
    "/reference:System.dll",
    "/reference:System.Core.dll"
)
$args = "/target:exe /out:`"$dir\Agent.exe`" " + ($refs -join " ") + " `"$dir\Agent.cs`""

# Derleme denemesi ve hata yakalama
$result = Start-Process -FilePath $csc -ArgumentList $args -Wait -NoNewWindow -PassThru -RedirectStandardOutput "$dir\build.log" -RedirectStandardError "$dir\build_err.log"
if ($result.ExitCode -ne 0) {
    $err = Get-Content "$dir\build_err.log" -Raw
    $msg = Get-Content "$dir\build.log" -Raw
    Write-Error "Derleme basarisiz.`nDETAY: $err`n$msg"
    exit 1
}

# --- 5. GOREV ZAMANLAYICI ---
$taskName = "RustDeskRMM"
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) { Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue; Unregister-ScheduledTask -TaskName $taskName -Confirm:$false }
$action = New-ScheduledTaskAction -Execute "$dir\Agent.exe"; $trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 0)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings | Out-Null
Start-ScheduledTask -TaskName $taskName
