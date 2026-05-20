<#
.SYNOPSIS
    Talay RMM Pro - Sıralı Kurulum Aracı (WinRM Port 5985)
.DESCRIPTION
    Belirtilen IP aralığını tek tek, sırayla kontrol eder. 
    WinRM portu (5985) açık olan cihazları tespit edip kurulum komutunu sırayla gönderir.
    Kullanıcıya her adımda görsel bilgi verir.
#>

param (
    [string]$BaseIP = "172.16.1.",
    [int]$StartRange = 1,
    [int]$EndRange = 254,
    [string]$SetupUrl = "https://rmm.talay.com/api/rustdesk/builder/install?host=rmm.talay.com&port=443"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " TALAY RMM - SIRALI KURULUM (SEQUENTIAL)  " -ForegroundColor Cyan
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
        $ar = $tcp.BeginConnect($ip, 5985, $null, $null)
        # Sıralı taramada hızlı ilerlemesi için 500ms timeout uyguluyoruz
        if ($ar.AsyncWaitHandle.WaitOne(500)) {
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
        Write-Host "WinRM ACIK ($target)!" -ForegroundColor Green
        Write-Host "   └─ Kurulum komutu gonderiliyor..." -ForegroundColor Cyan
        try {
            # Hataları yakalamak için ErrorAction Stop ile çalıştırıyoruz
            $output = Invoke-Command -ComputerName $target -ScriptBlock {
                param($url)
                try {
                    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
                    Invoke-RestMethod -Uri $url -UseBasicParsing | Invoke-Expression
                    return "BASARILI"
                } catch {
                    return "HATA: $_"
                }
            } -ArgumentList $SetupUrl -ErrorAction Stop
            
            Write-Host "   └─ Sonuc: $output" -ForegroundColor Green
        } catch {
            Write-Host "   └─ HATA: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Kapali veya WinRM devre disi." -ForegroundColor DarkGray
    }
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " Tum cihazlar kontrol edildi." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
