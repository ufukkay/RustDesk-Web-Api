<#
.SYNOPSIS
    RustDesk RMM Agent V2.1 - Stabilite Güncellemesi
#>

$dir = "C:\ProgramData\RustDeskRMM"
$apiServer = "https://rmm.talay.com"
$wsUrl = "wss://rmm.talay.com/agent-socket"

# --- 1. ADMIN KONTROLÜ ---
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[HATA] Lutfen bu scripti YONETICI olarak calistirin!" -ForegroundColor Red
    exit 1
}

# --- 2. CIHAZ ID TESPITI (Gelistirilmis) ---
$rdId = ""
$paths = @(
    "C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\rustdesk.toml",
    "C:\ProgramData\RustDesk\config\rustdesk.toml",
    "$env:AppData\RustDesk\config\rustdesk.toml",
    "C:\Users\*\AppData\Roaming\RustDesk\config\rustdesk.toml"
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        $content = Get-Content $p -Raw -ErrorAction SilentlyContinue
        if ($content -match 'id = ''([^'']+)''') { 
            $rdId = $matches[1]
            break
        }
    }
}

if (!$rdId) { $rdId = $env:COMPUTERNAME }
Write-Host ">> Tespit Edilen ID: $rdId" -ForegroundColor Cyan

# --- 3. C# KAYNAK KODU ---
$source = @"
using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Net.NetworkInformation;
using System.IO;
using Microsoft.Win32;
using System.Management;
using System.Net.WebSockets;

public class RustDeskAgent {
    [DllImport("user32.dll")]  static extern bool LockWorkStation();
    [DllImport("kernel32.dll")] static extern uint WTSGetActiveConsoleSessionId();
    [DllImport("wtsapi32.dll")] static extern bool WTSQueryUserToken(uint sessionId, out IntPtr phToken);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr hObject);
    [DllImport("advapi32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    static extern bool CreateProcessAsUser(IntPtr hToken, string app, string cmdLine, IntPtr procAttr, IntPtr threadAttr, bool inherit, uint flags, IntPtr env, string dir, ref STARTUPINFO si, out PROCESS_INFORMATION pi);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct STARTUPINFO { public int cb; public string lpReserved, lpDesktop, lpTitle; public int dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags; public short wShowWindow, cbReserved2; public IntPtr lpReserved2, hStdInput, hStdOutput, hStdError; }
    [StructLayout(LayoutKind.Sequential)]
    struct PROCESS_INFORMATION { public IntPtr hProcess, hThread; public int dwProcessId, dwThreadId; }

    static readonly string DeviceId     = "$rdId";
    static readonly string WsUrl        = "$wsUrl";
    static readonly string ApiServer    = "$apiServer";
    static readonly string AgentVersion = "v2.1.0";
    static readonly string LogFile      = @"C:\ProgramData\RustDeskRMM\agent.log";

    static string CachedUpdates = "0";
    static DateTime LastUpdateCheck = DateTime.MinValue;

    static void CheckWindowsUpdates() {
        if ((DateTime.Now - LastUpdateCheck).TotalHours < 6) return;
        Task.Run(() => {
            try {
                dynamic s = Activator.CreateInstance(Type.GetTypeFromProgID("Microsoft.Update.Searcher"));
                dynamic r = s.Search("IsInstalled=0 and Type='Software'");
                CachedUpdates = r.Updates.Count.ToString();
                LastUpdateCheck = DateTime.Now;
            } catch { CachedUpdates = "0"; }
        });
    }

    static void Log(string msg) { try { File.AppendAllText(LogFile, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " | " + msg + "\n"); } catch {} }

    static string Wmi(string cls, string prop) {
        try {
            using (var s = new ManagementObjectSearcher("SELECT " + prop + " FROM " + cls))
                foreach (ManagementObject o in s.Get()) if (o[prop] != null) return o[prop].ToString().Trim();
        } catch {}
        return "-";
    }

    public static void Main() {
        ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
        ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
        Log("Agent Basladi. ID=" + DeviceId);
        RunLoop().GetAwaiter().GetResult();
    }

    static async Task RunLoop() {
        Task.Run(new Action(RunHttpLoop));
        while (true) { try { await ConnectAndRun(); } catch { await Task.Delay(10000); } }
    }

    static void RunHttpLoop() {
        while (true) {
            try {
                string j = PrepareJson();
                using (var c = new WebClient()) {
                    c.Encoding = Encoding.UTF8;
                    c.Headers[HttpRequestHeader.ContentType] = "application/json";
                    c.UploadString(ApiServer + "/api/sysinfo", "POST", j);
                }
            } catch {}
            Thread.Sleep(60000);
        }
    }

    static async Task ConnectAndRun() {
        using (var ws = new ClientWebSocket()) {
            string uri = WsUrl + "?deviceId=" + DeviceId + "&hostname=" + Uri.EscapeDataString(Environment.MachineName) + "&type=agent";
            await ws.ConnectAsync(new Uri(uri), CancellationToken.None);
            Log("WS Baglandi.");
            
            await WsSend(ws, "{\"type\":\"telemetry\",\"deviceId\":\"" + DeviceId + "\",\"data\":" + PrepareJson() + "}");

            byte[] buf = new byte[65536];
            while (ws.State == WebSocketState.Open) {
                var res = await ws.ReceiveAsync(new ArraySegment<byte>(buf), CancellationToken.None);
                if (res.MessageType == WebSocketMessageType.Close) break;
                string msg = Encoding.UTF8.GetString(buf, 0, res.Count);
                await HandleMessage(ws, msg);
            }
        }
    }

    static string PrepareJson() {
        string mfr = Wmi("Win32_ComputerSystem", "Manufacturer"), mdl = Wmi("Win32_ComputerSystem", "Model");
        string ramRaw = Wmi("Win32_ComputerSystem", "TotalPhysicalMemory"), ram = "-";
        try { ram = string.Format("{0:N1} GB", long.Parse(ramRaw) / 1073741824.0); } catch {}
        string cpu = "-", os = "-", bld = "-";
        try { cpu = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\HARDWARE\DESCRIPTION\System\CentralProcessor\0", "ProcessorNameString", "-"); } catch {}
        try { os  = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName", "-"); } catch {}
        try { bld = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuildNumber", "-"); } catch {}
        if (bld != "-" && int.Parse(bld) >= 22000 && os.Contains("Windows 10")) os = os.Replace("Windows 10", "Windows 11");
        string serial = Wmi("Win32_BIOS", "SerialNumber"), disk = "-";
        try { var d = new DriveInfo("C"); disk = string.Format("{0:N1}/{1:N1} GB", d.AvailableFreeSpace / 1073741824.0, d.TotalSize / 1073741824.0); } catch {}
        string user = "-";
        try {
            user = Wmi("Win32_ComputerSystem", "UserName");
            if (string.IsNullOrEmpty(user) || user == "-") {
                using (var s = new ManagementObjectSearcher("SELECT * FROM Win32_Process WHERE Name='explorer.exe'")) {
                    foreach (ManagementObject o in s.Get()) {
                        var args = new string[] { "", "" };
                        if (Convert.ToInt32(o.InvokeMethod("GetOwner", args)) == 0) user = args[1] + "\\" + args[0];
                    }
                }
            }
        } catch {}
        string cpuU = "0", ramU = "0";
        try {
            using (var pc = new PerformanceCounter("Processor", "% Processor Time", "_Total")) { pc.NextValue(); Thread.Sleep(100); cpuU = ((int)pc.NextValue()).ToString(); }
            long tR = 0, fR = 0;
            using (var s = new ManagementObjectSearcher("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem")) foreach (ManagementObject o in s.Get()) tR = Convert.ToInt64(o["TotalPhysicalMemory"]);
            using (var s = new ManagementObjectSearcher("SELECT FreePhysicalMemory FROM Win32_OperatingSystem")) foreach (ManagementObject o in s.Get()) fR = Convert.ToInt64(o["FreePhysicalMemory"]) * 1024;
            if (tR > 0) ramU = ((int)((1.0 - (double)fR / tR) * 100)).ToString();
        } catch {}
        CheckWindowsUpdates();
        string nets = "[]";
        try {
            var nl = new System.Collections.Generic.List<string>();
            using (var s = new ManagementObjectSearcher("SELECT * FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled=True")) {
                foreach (ManagementObject o in s.Get()) {
                    string n = o["Description"]?.ToString() ?? "Eth", i = "-", m = "-", g = "-";
                    if (o["IPAddress"]!=null) i=((string[])o["IPAddress"])[0];
                    if (o["IPSubnet"]!=null) m=((string[])o["IPSubnet"])[0];
                    if (o["DefaultIPGateway"]!=null) g=((string[])o["DefaultIPGateway"])[0];
                    nl.Add("{\"name\":\""+Esc(n)+"\",\"ip\":\""+i+"\",\"mask\":\""+m+"\",\"gw\":\""+g+"\"}");
                }
            }
            nets = "[" + string.Join(",", nl.ToArray()) + "]";
        } catch {}
        return "{" + "\"id\":\""+DeviceId+"\",\"hostname\":\""+Esc(Environment.MachineName)+"\",\"user\":\""+Esc(user)+"\",\"processor\":\""+Esc(cpu)+"\",\"ram\":\""+ram+"\",\"disk\":\""+disk+"\",\"osName\":\""+Esc(os)+"\",\"osBuild\":\""+bld+"\",\"serialNumber\":\""+Esc(serial)+"\",\"manufacturer\":\""+Esc(mfr)+"\",\"model\":\""+Esc(mdl)+"\",\"cpuUsage\":\""+cpuU+"\",\"ramUsage\":\""+ramU+"\",\"pendingUpdates\":\""+CachedUpdates+"\",\"net_details\":"+nets+",\"agentVersion\":\""+AgentVersion+"\"" + "}";
    }

    static async Task HandleMessage(ClientWebSocket ws, string j) {
        try {
            string a = Val(j, "action");
            if (a == "lock") LockWorkStation();
            else if (a == "restart") Process.Start("shutdown", "/r /t 0 /f");
            else if (a == "shutdown") Process.Start("shutdown", "/s /t 0 /f");
            else if (a == "update") Process.Start("cmd.exe", "/c powershell -ExecutionPolicy Bypass -Command \"iwr -useb " + ApiServer + "/api/agent/setup | iex\"");
            else if (a == "terminal") {
                string c = Val(j, "command");
                var psi = new ProcessStartInfo("cmd.exe", "/c " + c) { RedirectStandardOutput = true, UseShellExecute = false, CreateNoWindow = true };
                var p = Process.Start(psi); string o = p.StandardOutput.ReadToEnd(); p.WaitForExit();
                await WsSend(ws, "{\"type\":\"result\",\"action\":\"terminal\",\"deviceId\":\""+DeviceId+"\",\"output\":\""+Convert.ToBase64String(Encoding.UTF8.GetBytes(o))+"\",\"isBase64\":true}");
            }
        } catch {}
    }

    static async Task WsSend(ClientWebSocket ws, string m) { byte[] b = Encoding.UTF8.GetBytes(m); await ws.SendAsync(new ArraySegment<byte>(b), WebSocketMessageType.Text, true, CancellationToken.None); }
    static string Val(string j, string k) { string n1 = "\"" + k + "\":\"", n2 = "\"" + k + "\": \""; int i = j.IndexOf(n1); if (i < 0) { i = j.IndexOf(n2); if (i < 0) return ""; i += n2.Length; } else { i += n1.Length; } int e = j.IndexOf("\"", i); return e < 0 ? "" : j.Substring(i, e - i); }
    static string Esc(string s) { return s == null ? "" : s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r"); }
}
"@

# 4. DERLEME VE KURULUM
Write-Host ">> Ajan derleniyor..." -ForegroundColor Cyan
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$source | Out-File -FilePath "$dir\Agent.cs" -Encoding utf8
$csc = (Get-ChildItem "C:\Windows\Microsoft.NET\Framework64\v4.0.*\csc.exe" -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
if (-not $csc) { $csc = (Get-ChildItem "C:\Windows\Microsoft.NET\Framework\v4.0.*\csc.exe" -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }
Start-Process -FilePath $csc -ArgumentList "/target:exe /out:$dir\Agent.exe /reference:System.Management.dll $dir\Agent.cs" -Wait -WindowStyle Hidden

# 5. SERVIS / TASK KURULUMU
$taskName = "RustDeskRMM"
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName $taskName -Confirm:$false }
Register-ScheduledTask -TaskName $taskName -Action (New-ScheduledTaskAction -Execute "$dir\Agent.exe") -Trigger (New-ScheduledTaskTrigger -AtStartup) -Principal (New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest) | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Host ">> Ajan v2.1.0 basariyla kuruldu!" -ForegroundColor Green
