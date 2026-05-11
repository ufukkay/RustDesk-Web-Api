# --- RUSTDESK RMM ULTIMATE INSTALLER (v7.3) ---
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
using Microsoft.Win32;
using System.Management;

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
        string serverUrl = "https://rmm.talay.com/api/heartbeat";
        string resultUrl = "https://rmm.talay.com/api/rustdesk/command/result";
        string deviceId = "$rdId"; 
        
        string agentVersion = "v1.1.0";
        
        // Statik Donanım Verileri (Sadece başlangıçta 1 kez çekilir)
        string osName = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName", "Windows") ?? "Windows";
        string osBuild = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuildNumber", "") ?? "";
        string processor = (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\HARDWARE\DESCRIPTION\System\CentralProcessor\0", "ProcessorNameString", "") ?? "";
        string adDomain = Environment.UserDomainName;
        
        string serialNumber = GetWmi("Win32_BIOS", "SerialNumber");
        string manufacturer = GetWmi("Win32_ComputerSystem", "Manufacturer");
        string model = GetWmi("Win32_ComputerSystem", "Model");
        string formFactor = GetWmi("Win32_ComputerSystem", "PCSystemType"); // integer
        if (formFactor == "1") formFactor = "Desktop";
        else if (formFactor == "2") formFactor = "Laptop/Mobile";
        else formFactor = "PC";

        WebClient client = new WebClient();
        client.Encoding = Encoding.UTF8;
        
        while (true) {
            try {
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
                                
                                cards.Add("{\"name\":\"" + ni.Name + "\", \"ip\":\"" + ip.Address.ToString() + "\", \"mask\":\"" + mask + "\", \"gw\":\"" + gw + "\", \"mac\":\"" + mac + "\", \"speed\":\"" + speed + "\"}");
                            }
                        }
                    }
                }
                
                string body = "{\"id\":\"" + deviceId + "\", \"disk\":\"" + disk + "\", \"hostname\":\"" + Environment.MachineName + "\", \"os\":\"" + osName + "\", \"osName\":\"" + osName + "\", \"osBuild\":\"" + osBuild + "\", \"processor\":\"" + processor + "\", \"adDomain\":\"" + adDomain + "\", \"serialNumber\":\"" + serialNumber + "\", \"manufacturer\":\"" + manufacturer + "\", \"model\":\"" + model + "\", \"formFactor\":\"" + formFactor + "\", \"bootTime\":\"" + bootTime + "\", \"agentVersion\":\"" + agentVersion + "\", \"network\":[" + string.Join(",", cards.ToArray()) + "]}";
                
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
& $csc /out:"$dir\RustDeskRMM.exe" /target:winexe /reference:System.Management.dll "$dir\Agent.cs"

$taskName = "RustDeskRMM_Service"
$action = New-ScheduledTaskAction -Execute "$dir\RustDeskRMM.exe"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
Start-ScheduledTask -TaskName $taskName

Write-Host "RustDesk RMM Agent (v7.3) basariyla kuruldu! ✅" -ForegroundColor Green
