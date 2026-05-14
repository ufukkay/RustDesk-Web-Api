<#
.SYNOPSIS
    RustDesk RMM Agent Uninstaller
#>

$dir          = "C:\ProgramData\RustDeskRMM"
$apiServer    = "https://rmm.talay.com"
$agentApiKey  = "AGENT_API_KEY_PLACEHOLDER"

# 1. Admin Kontrolü
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Lutfen Yonetici olarak calistirin."
    exit 1
}

# 2. Cihaz ID Tespiti
$rdId = ""
$configPaths = @(
    "C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\rustdesk.toml",
    "$env:AppData\RustDesk\config\rustdesk.toml"
)
foreach ($p in $configPaths) {
    if (!$rdId -and (Test-Path $p)) {
        $content = Get-Content $p -Raw
        if ($content -match "id = '([^']+)'") { $rdId = $matches[1] }
    }
}
if (!$rdId) { $rdId = $env:COMPUTERNAME }

Write-Host ">> RustDesk RMM Ajani kaldiriliyor... (ID: $rdId)"

# 3. Sunucuya Ayrılık Sinyali Gönder
try {
    $body = @{ id = $rdId } | ConvertTo-Json
    $headers = @{ "Content-Type" = "application/json" }
    if ($agentApiKey -and $agentApiKey -ne "AGENT_API_KEY_PLACEHOLDER") {
        $headers.Add("Authorization", "Bearer $agentApiKey")
    }
    Invoke-RestMethod -Uri "$apiServer/api/agent/unregister" -Method Post -Body $body -Headers $headers -ErrorAction SilentlyContinue
    Write-Host "[OK] Sunucu kaydi silindi."
} catch {
    Write-Host "[!] Sunucu kaydi silinemedi ama isleme devam ediliyor."
}

# 4. Gorev ve Surec Temizligi
$taskName = "RustDeskRMM"
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "[OK] Zamanlanmis gorev silindi."
}

Stop-Process -Name "Agent" -Force -ErrorAction SilentlyContinue

# 5. Dosya Temizligi
if (Test-Path $dir) {
    Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Ajan dosyalari silindi."
}

Write-Host "`n--- KALDIRMA TAMAMLANDI ---"
