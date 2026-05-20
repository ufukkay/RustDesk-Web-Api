# Pure ASCII version to prevent encoding issues in Windows PowerShell 5.1
# WMI (RPC Port 135) single PC deployment script using DCOM protocol.
param (
    [string]$Target = "",
    [string]$SetupUrl = "https://rmm.talay.com/api/rustdesk/builder/install?host=rmm.talay.com&port=443"
)

if ([string]::IsNullOrEmpty($Target)) {
    $Target = Read-Host "Hedef bilgisayarin IP adresi veya bilgisayar adini girin"
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " TALAY RMM - TEKLI UZAKTAN KURULUM        " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Hedef Cihaz: $Target" -ForegroundColor Yellow
Write-Host "Kurulum URL: $SetupUrl`n" -ForegroundColor Yellow

$opt = New-CimSessionOption -Protocol Dcom
$session = $null

try {
    Write-Host "[$Target] Baglanti kuruluyor (WMI/DCOM)... " -NoNewline -ForegroundColor Gray
    $session = New-CimSession -ComputerName $Target -SessionOption $opt -ErrorAction Stop
    Write-Host "BAGLANDI!" -ForegroundColor Green
    
    Write-Host "   - Kurulum komutu gonderiliyor..." -ForegroundColor Cyan
    $cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command `"[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-RestMethod -Uri '$SetupUrl' -UseBasicParsing | Invoke-Expression`""
    
    $result = Invoke-CimMethod -CimSession $session -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd } -ErrorAction Stop
    
    if ($result.ReturnValue -eq 0) {
        Write-Host "   - Sonuc: BASARILI (Process ID: $($result.ProcessId))" -ForegroundColor Green
        Write-Host "   - Ajan arka planda yukleniyor. Lutfen 1-2 dakika icinde RMM panelini kontrol edin." -ForegroundColor White
    } else {
        Write-Host "   - HATA: Surec baslatilamadi. Hata Kodu: $($result.ReturnValue)" -ForegroundColor Red
    }
} catch {
    Write-Host "HATA!" -ForegroundColor Red
    Write-Host "   - Hata Detayi: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($session) { Remove-CimSession $session -ErrorAction SilentlyContinue }
}

Write-Host "==========================================" -ForegroundColor Cyan
