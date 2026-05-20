<#
.SYNOPSIS
    Talay RMM Pro - Toplu Ajan Kurulum Aracı (WinRM Port 5985 tabanlı)
.DESCRIPTION
    Belirtilen IP aralığındaki (Örn: 172.16.1.1 - 254) cihazların WinRM portunu (5985) paralel olarak tarar.
    Kerberos kimlik doğrulamasının IP ile çalışmama sorununu çözmek için otomatik olarak DNS adını çözümler (FQDN kullanır).
    WinRM portu açık olan cihazlara eşzamanlı bağlanarak kurulumu başlatır.
#>

param (
    [string]$BaseIP = "172.16.1.",
    [int]$StartRange = 1,
    [int]$EndRange = 254,
    [string]$SetupUrl = "https://rmm.talay.com/api/rustdesk/builder/install?host=rmm.talay.com&port=443"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " TALAY RMM - TOPLU KURULUM (WinRM PORT SCAN) " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Hedef Ağ: ${BaseIP}${StartRange} - ${BaseIP}${EndRange}" -ForegroundColor Yellow
Write-Host "Kurulum URL: $SetupUrl" -ForegroundColor Yellow
Write-Host "Cihazlar taranıyor (WinRM 5985 portu denetleniyor ve DNS adları çözümleniyor)...`n" -ForegroundColor Gray

$ips = $StartRange..$EndRange | ForEach-Object { "${BaseIP}$_" }

# 1. WinRM Port 5985 Paralel Tarama ve DNS Çözümleme (Runspace Pool)
$RunspacePool = [runspacefactory]::CreateRunspacePool(1, 50)
$RunspacePool.Open()
$Jobs = @()

foreach ($ip in $ips) {
    $ScriptBlock = {
        param($ip)
        $tcp = New-Object System.Net.Sockets.TcpClient
        try {
            $ar = $tcp.BeginConnect($ip, 5985, $null, $null)
            if ($ar.AsyncWaitHandle.WaitOne(1000)) {
                if ($tcp.Connected) {
                    # Port açık, Kerberos hatası almamak için DNS adını (FQDN) paralel çözmeye çalış
                    try {
                        $fqdn = [System.Net.Dns]::GetHostEntry($ip).HostName
                        if ($fqdn) { return @{ ip = $ip; target = $fqdn; success = $true } }
                    } catch {}
                    # DNS çözülemezse IP adresine geri dön
                    return @{ ip = $ip; target = $ip; success = $true }
                }
            }
        } catch {} finally {
            $tcp.Close()
        }
        return $null
    }
    $PowerShell = [PowerShell]::Create().AddScript($ScriptBlock).AddArgument($ip)
    $PowerShell.RunspacePool = $RunspacePool
    $Jobs += [PSCustomObject]@{
        Pipe = $PowerShell
        Result = $PowerShell.BeginInvoke()
    }
}

# Sonuçları Toplama
$onlineTargets = @()
$displayInfo = @()
foreach ($Job in $Jobs) {
    $res = $Job.Pipe.EndInvoke($Job.Result)
    if ($res -and $res.success) {
        $onlineTargets += $res.target
        if ($res.ip -ne $res.target) {
            $displayInfo += "$($res.ip) -> $($res.target)"
        } else {
            $displayInfo += "$($res.ip) (DNS Çözülemedi)"
        }
    }
    $Job.Pipe.Dispose()
}
$RunspacePool.Close()

Write-Host "Toplam Bulunan Aktif Cihaz (WinRM Açık): $($onlineTargets.Count)" -ForegroundColor Green

if ($onlineTargets.Count -eq 0) {
    Write-Host "Ağda WinRM portu (5985) açık olan hiçbir cihaz bulunamadı!" -ForegroundColor Red
    exit
}

Write-Host "Aktif Cihazlar: $($displayInfo -join ' | ')" -ForegroundColor DarkGray

# 2. Kurulum Komutu
$scriptBlock = {
    param([string]$url)
    try {
        Write-Output "[$env:COMPUTERNAME] Kurulum baslatiliyor..."
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-RestMethod -Uri $url -UseBasicParsing | Invoke-Expression
        Write-Output "[$env:COMPUTERNAME] Kurulum tamamlandi."
    } catch {
        Write-Error "[$env:COMPUTERNAME] Hata: $_"
    }
}

Write-Host "`nKurulum komutları gönderiliyor (Kerberos/WinRM)..." -ForegroundColor Cyan

# 3. Invoke-Command ile paralel kurulum
try {
    $results = Invoke-Command -ComputerName $onlineTargets -ScriptBlock $scriptBlock -ArgumentList $SetupUrl -ErrorAction Continue

    Write-Host "`n--- Kurulum Sonuçları ---" -ForegroundColor Cyan
    foreach ($res in $results) {
        Write-Host "[$($res.PSComputerName)] $($res)" -ForegroundColor Gray
    }
} catch {
    Write-Host "WinRM bağlantısında genel bir hata oluştu." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " Toplu kurulum işlemi tamamlandı." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
