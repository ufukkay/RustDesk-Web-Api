# --- RUSTDESK RMM ULTIMATE INSTALLER (v7.2) ---
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

# Ekstra kontrol: RustDesk servisi calisiyorsa servisten de alinabilir mi? (Gelecek plani)
# Simdilik mevcut yontemi guclendirdik.
if (-not $rdId) { $rdId = Read-Host "RustDesk ID otomatik bulunamadi, lutfen elle girin" }
if (-not $rdId) { Write-Error "ID olmadan devam edilemez!"; return }

# 2. C# AGENT KAYNAK KODU
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
    public static void Main() {
        string serverUrl = "https://rmm.talay.com/api/heartbeat";
        string resultUrl = "https://rmm.talay.com/api/rustdesk/command/result";
        string deviceId = "$rdId"; 
        WebClient client = new WebClient();
        client.Encoding = Encoding.UTF8;
        while (true) {
            try {
                DriveInfo c = new DriveInfo("C");
                string disk = string.Format("{0:N1} GB / {1:N1} GB", c.AvailableFreeSpace / 1073741824.0, c.TotalSize / 1073741824.0);
                List<string> cards = new List<string>();
                foreach (var ni in NetworkInterface.GetAllNetworkInterfaces()) {
                    if (ni.OperationalStatus == OperationalStatus.Up && ni.NetworkInterfaceType != NetworkInterfaceType.Loopback) {
                        foreach (var ip in ni.GetIPProperties().UnicastAddresses) {
                            if (ip.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork) {
                                string gw = ni.GetIPProperties().GatewayAddresses.Count > 0 ? ni.GetIPProperties().GatewayAddresses[0].Address.ToString() : "-";
                                cards.Add("{\"name\":\"" + ni.Name + "\", \"ip\":\"" + ip.Address.ToString() + "\", \"mask\":\"" + ip.IPv4Mask.ToString() + "\", \"gw\":\"" + gw + "\"}");
                            }
                        }
                    }
                }
                string body = "{\"id\":\"" + deviceId + "\", \"disk\":\"" + disk + "\", \"hostname\":\"" + Environment.MachineName + "\", \"os\":\"Windows\", \"network\":[" + string.Join(",", cards.ToArray()) + "]}";
                client.Headers[HttpRequestHeader.ContentType] = "application/json";
                string resString = client.UploadString(serverUrl, "POST", body);
                if (resString.Contains("\"command\":\"") && !resString.Contains("\"command\":null")) {
                    string cmd = resString.Split(new[] { "\"command\":\"" }, StringSplitOptions.None)[1].Split('"')[0];
                    if (cmd == "lock") LockWorkStation();
                    else if (cmd == "tsdiscon") Process.Start("tsdiscon.exe");
                    else if (cmd == "shutdown /s /t 5 /f") Process.Start("shutdown", "/s /t 0 /f");
                    else if (cmd == "shutdown /r /t 5 /f") Process.Start("shutdown", "/r /t 0 /f");
                    else if (cmd != "refresh_info") {
                        ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + cmd) { RedirectStandardOutput = true, UseShellExecute = false, CreateNoWindow = true };
                        var p = Process.Start(psi);
                        string output = p.StandardOutput.ReadToEnd();
                        string b64Output = Convert.ToBase64String(Encoding.UTF8.GetBytes(output));
                        string resultBody = "{\"deviceId\":\"" + deviceId + "\", \"output\":\"" + b64Output + "\", \"isBase64\": true}";
                        client.Headers[HttpRequestHeader.ContentType] = "application/json";
                        client.UploadString(resultUrl, "POST", resultBody);
                    }
                }
            } catch { }
            Thread.Sleep(10000);
        }
    }
}
"@
$source | Out-File -FilePath "$dir\Agent.cs" -Encoding utf8 -Force

# 3. DERLE VE SERVIS OLARAK AYARLA
$csc = (Get-ChildItem "C:\Windows\Microsoft.NET\Framework64\v4.0.*\csc.exe" | Select-Object -First 1).FullName
Stop-Process -Name "RustDeskRMM" -ErrorAction SilentlyContinue
& $csc /out:"$dir\RustDeskRMM.exe" /target:winexe "$dir\Agent.cs"

$taskName = "RustDeskRMM_Service"
$action = New-ScheduledTaskAction -Execute "$dir\RustDeskRMM.exe"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
Start-ScheduledTask -TaskName $taskName

Write-Host "RustDesk RMM Agent basariyla kuruldu! ✅" -ForegroundColor Green
