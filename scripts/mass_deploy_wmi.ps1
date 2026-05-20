# Pure ASCII version to prevent encoding issues in Windows PowerShell 5.1
# WMI (RPC Port 135) deployment script.
param (
    [string]$BaseIP = "172.16.1.",
    [int]$StartRange = 1,
    [int]$EndRange = 254,
    [string]$SetupUrl = "https://rmm.talay.com/api/rustdesk/builder/install?host=rmm.talay.com&port=443"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " TALAY RMM - WMI TOPLU KURULUM (RPC 135)  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Hedef Ag: ${BaseIP}${StartRange} - ${BaseIP}${EndRange}" -ForegroundColor Yellow
Write-Host "Kurulum URL: $SetupUrl`n" -ForegroundColor Yellow

$StartRange..$EndRange | ForEach-Object {
    $ip = "${BaseIP}$_"
    Write-Host "[$ip] Kontrol ediliyor... " -NoNewline -ForegroundColor Gray
    
    $tcp = New-Object System.Net.Sockets.TcpClient
    $success = $false
    $target = $ip
    
    try {
        $ar = $tcp.BeginConnect($ip, 135, $null, $null) # WMI/RPC Port 135
        if ($ar.AsyncWaitHandle.WaitOne(300)) { # 300ms timeout
            if ($tcp.Connected) {
                $success = $true
                try {
                    $fqdn = [System.Net.Dns]::GetHostEntry($ip).HostName
                    if ($fqdn) { $target = $fqdn }
                } catch {}
            }
        }
    } catch {} finally {
        $tcp.Close()
    }
    
    if ($success) {
        Write-Host "WMI/RPC ACIK ($target)!" -ForegroundColor Green
        Write-Host "   - Kurulum komutu gonderiliyor..." -ForegroundColor Cyan
        try {
            # Kurulum komutunu WMI uzerinden uzaktaki bilgisayarda calistiriyoruz
            $cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command `\"[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-RestMethod -Uri '$SetupUrl' -UseBasicParsing | Invoke-Expression`\""
            
            $result = Invoke-CimMethod -ComputerName $target -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd } -ErrorAction Stop
            
            if ($result.ReturnValue -eq 0) {
                Write-Host "   - Sonuc: BASARILI (Process ID: $($result.ProcessId))" -ForegroundColor Green
            } else {
                Write-Host "   - HATA: Surec baslatilamadi. Hata Kodu: $($result.ReturnValue)" -ForegroundColor Red
            }
        } catch {
            Write-Host "   - HATA: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Kapali veya WMI devre disi." -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Tum cihazlar kontrol edildi." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
