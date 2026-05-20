<#
.SYNOPSIS
    Talay RMM Pro - Toplu Ajan Kurulum Aracı (WinRM tabanlı)
.DESCRIPTION
    Belirtilen IP aralığındaki (Örn: 172.16.1.1 - 254) cihazların önce Ping ile açık olup olmadığını denetler.
    Ardından açık olan cihazlara WinRM üzerinden eşzamanlı (paralel) bağlanarak RustDesk RMM ajanını kurar.
    Not: Bu scriptin Domain Admin yetkisine sahip bir kullanıcıyla çalıştırılması gerekir.
#>

param (
    [string]$BaseIP = "172.16.1.",
    [int]$StartRange = 1,
    [int]$EndRange = 254,
    [string]$SetupUrl = "https://rmm.talay.com/api/agent/setup"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " TALAY RMM - TOPLU KURULUM (MASS DEPLOY)  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Hedef Ağ: ${BaseIP}${StartRange} - ${BaseIP}${EndRange}" -ForegroundColor Yellow
Write-Host "Kurulum URL: $SetupUrl" -ForegroundColor Yellow
Write-Host "Lütfen bekleyin, cihazlar taranıyor...`n" -ForegroundColor Gray

# 1. Ping ile IP Taraması (Parallel)
$ips = $StartRange..$EndRange | ForEach-Object { "${BaseIP}$_" }

$pingJobs = @()
foreach ($ip in $ips) {
    $pingJobs += Test-Connection -ComputerName $ip -Count 1 -Quiet -AsJob
}

Write-Host "Ping sonuçları bekleniyor..." -ForegroundColor Gray
Wait-Job -Job $pingJobs | Out-Null

$onlineIPs = @()
foreach ($job in $pingJobs) {
    $result = Receive-Job -Job $job
    if ($result) {
        # Job Name genellikle bilgisayar ismini tutar ama IP'yi eşleştirmek zordur
        # Bunun yerine job objesinin Location parametresi IP'dir
        $onlineIPs += $job.Location
    }
}
Remove-Job -Job $pingJobs

Write-Host "Toplam Bulunan Çevrimiçi Cihaz: $($onlineIPs.Count)" -ForegroundColor Green

if ($onlineIPs.Count -eq 0) {
    Write-Host "Ağda açık hiçbir cihaz bulunamadı!" -ForegroundColor Red
    exit
}

Write-Host "Çevrimiçi Cihazlar: $($onlineIPs -join ', ')" -ForegroundColor DarkGray

# 2. Kurulum Komutu
$scriptBlock = {
    param([string]$url)
    try {
        Write-Output "[$env:COMPUTERNAME] Kurulum indiriliyor ve baslatiliyor..."
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-RestMethod -Uri $url -UseBasicParsing | Invoke-Expression
        Write-Output "[$env:COMPUTERNAME] Islem tamamlandi."
    } catch {
        Write-Error "[$env:COMPUTERNAME] Hata: $_"
    }
}

Write-Host "`nKurulum işlemi başlatılıyor... (WinRM)" -ForegroundColor Cyan
Write-Host "Bu işlem cihaz sayısına göre birkaç dakika sürebilir.`n" -ForegroundColor Yellow

# 3. Invoke-Command ile paralel kurulum
try {
    # Hata veren IP'leri atlaması için ErrorAction Continue kullanıyoruz
    $results = Invoke-Command -ComputerName $onlineIPs -ScriptBlock $scriptBlock -ArgumentList $SetupUrl -ErrorAction Continue

    Write-Host "`n--- Kurulum Çıktıları ---" -ForegroundColor Cyan
    foreach ($res in $results) {
        Write-Host "[$($res.PSComputerName)] $($res)" -ForegroundColor Gray
    }
} catch {
    Write-Host "WinRM bağlantısında bir hata oluştu. WinRM izinlerini kontrol edin." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " Toplu kurulum süreci sona erdi." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
