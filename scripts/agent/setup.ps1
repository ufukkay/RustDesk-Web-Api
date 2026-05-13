<#
.SYNOPSIS
    RustDesk RMM Agent V3.2.0 - Stabiliteye Donus
#>

$dir = "C:\ProgramData\RustDeskRMM"
$apiServer = "https://rmm.talay.com"
$wsUrl = "wss://rmm.talay.com/agent-socket"

# --- 1. ADMIN VE KLASOR KONTROLU ---
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { exit 1 }
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

# --- 2. CIHAZ ID TESPITI (Calisan v3.1.0 Mantigi) ---
$rdId = ""
$configPath = "C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\rustdesk.toml"
if (Test-Path $configPath) {
    $content = Get-Content $configPath -Raw
    if ($content -match 'id = ''([^'']+)''') { $rdId = $matches[1] }
}
if (!$rdId -and (Test-Path "$env:AppData\RustDesk\config\rustdesk.toml")) {
    $content = Get-Content "$env:AppData\RustDesk\config\rustdesk.toml" -Raw
    if ($content -match 'id = ''([^'']+)''') { $rdId = $matches[1] }
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

public class RustDeskAgent {
    static readonly string DeviceId     = "$rdId";
    static readonly string WsUrl        = "$wsUrl";
    static readonly string ApiServer    = "$apiServer";
    static readonly string AgentVersion = "v3.2.0";

    static string CachedUpdates = "0";
    static DateTime LastUpdateCheck = DateTime.MinValue;

    static void CheckUpdates() {
        if ((DateTime.Now - LastUpdateCheck).TotalHours < 6) {
            Task.Run(() => {
                try {
                    dynamic s = Activator.CreateInstance(Type.GetTypeFromProgID("Microsoft.Update.Searcher"));
                    CachedUpdates = s.Search("IsInstalled=0 and Type='Software'").Updates.Count.ToString();
                    LastUpdateCheck = DateTime.Now;
                } catch { CachedUpdates = "0"; }
            });
        }
    }

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
        RunLoop().GetAwaiter().GetResult();
    }

    static async Task RunLoop() {
        Task.Run(() => {
            while (true) {
                try {
                    using (var c = new WebClient()) {
                        c.Encoding = Encoding.UTF8;
                        c.Headers["Content-Type"] = "application/json";
                        c.UploadString(ApiServer + "/api/sysinfo", "POST", PrepareJson());
                    }
                } catch {}
                Thread.Sleep(60000);
            }
        });
        while (true) { try { await Connect(); } catch { await Task.Delay(10000); } }
    }

    static async Task Connect() {
        using (var ws = new ClientWebSocket()) {
            string q = "?deviceId=" + DeviceId + "&hostname=" + Uri.EscapeDataString(Environment.MachineName) + "&type=agent";
            await ws.ConnectAsync(new Uri(WsUrl + q), CancellationToken.None);
            await Send(ws, "{\"type\":\"telemetry\",\"deviceId\":\""+DeviceId+"\",\"data\":" + PrepareJson() + "}");
            byte[] b = new byte[65536];
            while (ws.State == WebSocketState.Open) {
                var r = await ws.ReceiveAsync(new ArraySegment<byte>(b), CancellationToken.None);
                if (r.MessageType == WebSocketMessageType.Close) break;
                await Handle(ws, Encoding.UTF8.GetString(b, 0, r.Count));
            }
        }
    }

    static string PrepareJson() {
        string cpu = "-", os = "-", bld = "-";
        try { cpu = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\HARDWARE\DESCRIPTION\System\CentralProcessor\0", "ProcessorNameString", "-"); } catch {}
        try { os  = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName", "-"); } catch {}
        try { bld = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuildNumber", "-"); } catch {}
        if (bld != "-" && int.Parse(bld) >= 22000 && os.Contains("Windows 10")) os = os.Replace("Windows 10", "Windows 11");
        
        string ramRaw = Wmi("Win32_ComputerSystem", "TotalPhysicalMemory");
        string ram = "-"; try { ram = string.Format("{0:N1} GB", long.Parse(ramRaw) / 1073741824.0); } catch {}

        string disk = "-"; try { var d = new DriveInfo("C"); disk = string.Format("{0:N1}/{1:N1} GB", d.AvailableFreeSpace/1073741824.0, d.TotalSize/1073741824.0); } catch {}
        
        string user = "-";
        try {
            user = Wmi("Win32_ComputerSystem", "UserName");
            if (user == "-") {
                using (var s = new ManagementObjectSearcher("SELECT * FROM Win32_Process WHERE Name='explorer.exe'"))
                    foreach (ManagementObject o in s.Get()) {
                        var args = new string[] { "", "" };
                        if (Convert.ToInt32(o.InvokeMethod("GetOwner", args)) == 0) user = args[1] + "\\" + args[0];
                    }
            }
        } catch {}

        CheckUpdates();

        return "{" + "\"id\":\""+DeviceId+"\",\"hostname\":\""+Environment.MachineName+"\",\"user\":\""+user+"\",\"processor\":\""+cpu+"\",\"ram\":\""+ram+"\",\"disk\":\""+disk+"\",\"osName\":\""+os+"\",\"osBuild\":\""+bld+"\",\"agentVersion\":\""+AgentVersion+"\",\"pendingUpdates\":\""+CachedUpdates+"\"" + "}";
    }

    static async Task Handle(ClientWebSocket ws, string j) {
        try {
            string a = Val(j, "action");
            if (a == "lock") Process.Start("rundll32.exe", "user32.dll,LockWorkStation");
            else if (a == "restart") Process.Start("shutdown", "/r /t 0 /f");
            else if (a == "shutdown") Process.Start("shutdown", "/s /t 0 /f");
            else if (a == "update") Process.Start("cmd.exe", "/c powershell -ExecutionPolicy Bypass -Command \"iwr -useb " + ApiServer + "/api/agent/setup | iex\"");
            else if (a == "terminal") {
                string c = Val(j, "command");
                var psi = new ProcessStartInfo("cmd.exe", "/c " + c) { RedirectStandardOutput = true, UseShellExecute = false, CreateNoWindow = true };
                var p = Process.Start(psi); string o = p.StandardOutput.ReadToEnd(); p.WaitForExit();
                await Send(ws, "{\"type\":\"result\",\"deviceId\":\""+DeviceId+"\",\"output\":\""+Convert.ToBase64String(Encoding.UTF8.GetBytes(o))+"\",\"isBase64\":true}");
            }
        } catch {}
    }

    static async Task Send(ClientWebSocket ws, string m) { byte[] b = Encoding.UTF8.GetBytes(m); await ws.SendAsync(new ArraySegment<byte>(b), WebSocketMessageType.Text, true, CancellationToken.None); }
    static string Val(string j, string k) { string n = "\"" + k + "\":\""; int i = j.IndexOf(n); if (i < 0) return ""; i += n.Length; int e = j.IndexOf("\"", i); return e < 0 ? "" : j.Substring(i, e - i); }
}
"@

# --- 4. DERLEME VE BASLATMA ---
$source | Out-File -FilePath "$dir\Agent.cs" -Encoding utf8
$csc = (Get-ChildItem "C:\Windows\Microsoft.NET\Framework*\v4.0.*\csc.exe" | Select-Object -First 1).FullName
Start-Process -FilePath $csc -ArgumentList "/target:exe /out:$dir\Agent.exe /reference:System.Management.dll $dir\Agent.cs" -Wait -WindowStyle Hidden

$taskName = "RustDeskRMM"
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName $taskName -Confirm:$false }
Register-ScheduledTask -TaskName $taskName -Action (New-ScheduledTaskAction -Execute "$dir\Agent.exe") -Trigger (New-ScheduledTaskTrigger -AtStartup) -Principal (New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest) | Out-Null
Start-ScheduledTask -TaskName $taskName
