# =============================================================================
# RUSTDESK RMM AGENT V3 — INSTALLER
# =============================================================================
param($apiServer)

# --- 1. API SUNUCU TESPITI ---
$settingsFile = "C:\ProgramData\RustDeskRMM\settings.json"
if (-not $apiServer) {
    if (Test-Path $settingsFile) {
        try { $cfg = Get-Content $settingsFile -Raw | ConvertFrom-Json; $apiServer = $cfg.apiServer } catch {}
    }
    if (-not $apiServer) { $apiServer = "https://rmm.talay.com" }
}
$wsUrl = ($apiServer -replace '^https://', 'wss://' -replace '^http://', 'ws://').TrimEnd('/') + "/agent-socket"

$dir = "C:\ProgramData\RustDeskRMM"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
@{ apiServer = $apiServer } | ConvertTo-Json | Set-Content $settingsFile -Encoding UTF8 -Force

Write-Host ">> Sunucu : $apiServer" -ForegroundColor Cyan

# --- 2. ID TESPITI ---
$rdId = ""
$possiblePaths = @(
    "$env:ProgramData\RustDesk\config\RustDesk.toml",
    "C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\RustDesk.toml",
    "$env:AppData\RustDesk\config\RustDesk.toml"
)
Write-Host ">> RustDesk ID araniyor..." -ForegroundColor Yellow
for ($i=0; $i -lt 15; $i++) {
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $content = Get-Content $p -Raw -ErrorAction SilentlyContinue
            if ($content -match 'id\s*=\s*[''"]?(\d{6,15})[''"]?') { $rdId = $matches[1]; break }
        }
    }
    if ($rdId) { break }
    $rdExe = if (Test-Path "C:\Program Files\RustDesk\rustdesk.exe") { "C:\Program Files\RustDesk\rustdesk.exe" } else { "C:\Program Files (x86)\RustDesk\rustdesk.exe" }
    if (Test-Path $rdExe) {
        $cliId = (& $rdExe --get-id 2>$null) -replace '\s',''
        if ($cliId -match '^\d{6,15}$') { $rdId = $cliId; break }
    }
    Write-Host "   Bekleniyor... ($($i+1)/15)" -ForegroundColor DarkGray
    Start-Sleep -Seconds 2
}
if (-not $rdId) { Write-Error "ID Bulunamadi!"; return }
Write-Host "[OK] ID: $rdId" -ForegroundColor Green

# --- 3. C# KAYNAK KODU ---
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
    static readonly string AgentVersion = "v3.0.1";
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
        Log("Agent Basladi. ID=" + DeviceId);
        RunLoop().GetAwaiter().GetResult();
    }

    static async Task RunLoop() {
        var _ = Task.Run(() => RunHttpLoop());
        while (true) {
            try { await ConnectAndRun(); } catch (Exception ex) { Log("WS Hatasi: " + ex.Message); }
            await Task.Delay(10000);
        }
    }

    static async Task RunHttpLoop() {
        while (true) {
            try {
                string json = PrepareJson();
                using (var c = new WebClient()) {
                    c.Encoding = Encoding.UTF8;
                    c.Headers[HttpRequestHeader.ContentType] = "application/json";
                    c.UploadString(ApiServer + "/api/sysinfo", "POST", json);
                }
                Log("HTTP Telemetri Gonderildi.");
            } catch (Exception ex) { Log("HTTP Hatasi: " + ex.Message); }
            await Task.Delay(60000);
        }
    }

    static async Task ConnectAndRun() {
        using (var ws = new ClientWebSocket()) {
            string uri = WsUrl + "?deviceId=" + DeviceId + "&hostname=" + Uri.EscapeDataString(Environment.MachineName) + "&type=agent";
            await ws.ConnectAsync(new Uri(uri), CancellationToken.None);
            Log("WS Baglandi.");
            
            await WsSend(ws, "{\"type\":\"telemetry\",\"deviceId\":\""+DeviceId+"\",\"data\":"+PrepareJson()+"}");

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
        string mfr = Wmi("Win32_ComputerSystem", "Manufacturer");
        string mdl = Wmi("Win32_ComputerSystem", "Model");
        string ramRaw = Wmi("Win32_ComputerSystem", "TotalPhysicalMemory");
        string ram = "-";
        try { ram = string.Format("{0:N1} GB", long.Parse(ramRaw) / 1073741824.0); } catch {}
        
        string cpu = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\HARDWARE\DESCRIPTION\System\CentralProcessor\0", "ProcessorNameString", "-");
        string os = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName", "Windows");
        string bld = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuildNumber", "");
        string serial = Wmi("Win32_BIOS", "SerialNumber");
        
        var drive = new DriveInfo("C");
        string disk = string.Format("{0:N1}/{1:N1} GB", drive.AvailableFreeSpace/1073741824.0, drive.TotalSize/1073741824.0);

        return "{"
            + "\"id\":\"" + DeviceId + "\","
            + "\"hostname\":\"" + Esc(Environment.MachineName) + "\","
            + "\"processor\":\"" + Esc(cpu) + "\","
            + "\"ram\":\"" + ram + "\","
            + "\"disk\":\"" + disk + "\","
            + "\"osName\":\"" + Esc(os) + "\","
            + "\"osBuild\":\"" + bld + "\","
            + "\"serialNumber\":\"" + Esc(serial) + "\","
            + "\"manufacturer\":\"" + Esc(mfr) + "\","
            + "\"model\":\"" + Esc(mdl) + "\","
            + "\"agentVersion\":\"" + AgentVersion + "\""
            + "}";
    }

    static async Task HandleMessage(ClientWebSocket ws, string json) {
        try {
            string action = Val(json, "action");
            if (action == "lock") LockWorkStation();
            else if (action == "restart") Process.Start("shutdown", "/r /t 0 /f");
            else if (action == "shutdown") Process.Start("shutdown", "/s /t 0 /f");
            else if (action == "terminal") {
                string cmd = Val(json, "command");
                var psi = new ProcessStartInfo("cmd.exe", "/c " + cmd) { RedirectStandardOutput = true, UseShellExecute = false, CreateNoWindow = true };
                var p = Process.Start(psi);
                string outStr = p.StandardOutput.ReadToEnd();
                p.WaitForExit();
                string res = "{\"type\":\"result\",\"action\":\"terminal\",\"deviceId\":\""+DeviceId+"\",\"output\":\""+Convert.ToBase64String(Encoding.UTF8.GetBytes(outStr))+"\",\"isBase64\":true}";
                await WsSend(ws, res);
            }
        } catch {}
    }

    static async Task WsSend(ClientWebSocket ws, string msg) {
        byte[] b = Encoding.UTF8.GetBytes(msg);
        await ws.SendAsync(new ArraySegment<byte>(b), WebSocketMessageType.Text, true, CancellationToken.None);
    }

    static string Val(string j, string k) {
        string n = "\""+k+"\":\""; int i = j.IndexOf(n); if (i<0) return ""; i+=n.Length;
        int e = j.IndexOf("\"", i); return e<0 ? "" : j.Substring(i, e-i);
    }

    static string Esc(string s) {
        return s?.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r") ?? "";
    }
}
"@

# --- 4. DERLEME ---
Write-Host ">> Derleniyor..." -ForegroundColor Cyan
$source | Out-File -FilePath "$dir\Agent.cs" -Encoding utf8 -Force
$csc = (Get-ChildItem "C:\Windows\Microsoft.NET\Framework64\v4.0.*\csc.exe" | Select-Object -First 1).FullName
& $csc /out:"$dir\RustDeskRMM.exe" /target:winexe /reference:System.Management.dll /reference:System.dll /reference:System.Net.dll "$dir\Agent.cs" | Out-Null

# --- 5. SERVIS KAYIT ---
$taskName = "RustDeskRMM_Service"
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction -Execute "$dir\RustDeskRMM.exe"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Host "[OK] Tamamlandi." -ForegroundColor Green
