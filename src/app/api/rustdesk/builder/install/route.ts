import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/rustdesk/builder/install
 * Dinamik olarak yapılandırılmış bir PowerShell kurulum scripti döner.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getSettings();
    
    // Varsayılan değerler
    const host = searchParams.get("host") || settings.host;
    const port = searchParams.get("port") || settings.port;
    const defaultPassword = settings.defaultPassword || "";
    
    // Sunucu anahtarını bulmaya çalış
    const keyPaths = [
      "/home/rd/rustdesk/id_ed25519.pub",
      "/var/lib/rustdesk-server/id_ed25519.pub",
      "/root/rustdesk/id_ed25519.pub",
      "./id_ed25519.pub"
    ];
    let serverKey = "YOK";
    for (const p of keyPaths) {
      if (fs.existsSync(p)) {
        serverKey = fs.readFileSync(p, "utf-8").trim();
        break;
      }
    }

    const fullServerUrl = `http://${host}:${port}`;

    // C# kodunu Base64 olarak paketliyoruz (TS hatalarını önlemek için)
    const base64Agent = "dXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uTmV0Owp1c2luZyBTeXN0ZW0uVGV4dDsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKdXNpbmcgU3lzdGVtLkRpYWdub3N0aWNzOwp1c2luZyBTeXN0ZW0uUnVudGltZS5JbnRlcm9wU2VydmljZXM7CnVzaW5nIFN5c3RlbS5Db2xsZWN0aW9ucy5HZW5lcmljOwp1c2luZyBTeXN0ZW0uTmV0Lk5ldHdvcmtJbmZvcm1hdGlvbjsKdXNpbmcgU3lzdGVtLklPOwoKcHVibGljIGNsYXNzIFJ1c3REZXNrQWdlbnQgewogICAgcHVibGljIHN0YXRpYyB2b2lkIE1haW4oKSB7CiAgICAgICAgc3RyaW5nIHNlcnZlclVybCA9ICJbW1NFUlZFUl9VUkxdXS9hcGkvaGVhcnRiZWF0IjsKICAgICAgICBzdHJpbmcgcmVzdWx0VXJsID0gIltbU0VSVkVSX1VSTF1dL2FwaS9ydXN0ZGVzay9jb21tYW5kL3Jlc3VsdCI7CiAgICAgICAgc3RyaW5nIGRldmljZUlkID0gIltbQUdFTlRfSURfXSI7IAogICAgICAgIFdlYkNsaWVudCBjbGllbnQgPSBuZXcgV2ViQ2xpZW50KCk7CiAgICAgICAgY2xpZW50LkVuY29kaW5nID0gRW5jb2RpbmcuVVRGODg7CiAgICAgICAgCiAgICAgICAgd2hpbGUgKHRydWUpIHsKICAgICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgICAgIERyaXZlSW5mbyBjID0gbmV3IERyaXZlSW5mbygiQyIpOwogICAgICAgICAgICAgICAgc3RyaW5nIGRpc2sgPSBzdHJpbmcuRm9ybWF0KCJ7MDpOMX0gR0IgLyB7MTpOMX0gR0IiLCBjLkF2YWlsYWJsZUZyZWVTcGFjZSAvIDEwNzM3NDE4MjQuMCwgYy5Ub3RhbFNpemUgLyAxMDczNzQxODI0LjApOwogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICBMaXN0PHN0cmluZz4gY2FyZEpzb25zID0gbmV3IExpc3Q8c3RyaW5nPigpOwogICAgICAgICAgICAgICAgZm9yZWFjaCAodmFyIG5pIGluIE5ldHdvcmtJbnRlcmZhY2UuR2V0QWxsTmV0d29ya0ludGVyZmFjZXMoKSkgewogICAgICAgICAgICAgICAgICAgIGlmIChuaS5PcGVyYXRpb25hbFN0YXR1cyA9PSBPcGVyYXRpb25hbFN0YXR1cy5VcCAmJiBuaS5OZXR3b3JrSW50ZXJmYWNlVHlwZSAhPSBOZXR3b3JrSW50ZXJmYWNlVHlwZS5Mb29wYmFjaykgewogICAgICAgICAgICAgICAgICAgICAgICBmb3JlYWNoICh2YXIgaXAgaW4gbmkuR2V0SVBQcm9wZXJ0aWVzKCkuVW5pY2FzdEFkZHJlc3NlcykgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlwLkFkZHJlc3MuQWRkcmVzc0ZhbWlseSA9PSBTeXN0ZW0uTmV0LlNvY2tldHMuQWRkcmVzc0ZhbWlseS5JbnRlck5ldHdvcmspIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgZ3cgPSBuaS5HZXRJUFByb3BlcnRpZXMoKS5HYXRld2F5QWRkcmVzc2VzLkNvdW50ID4gMCA/IG5pLkdldElQUHJvcGVydGllcygpLkdhdGV3YXlBZGRyZXNzZXNbMF0uQWRkcmVzcy5Ub1N0cmluZygpIDogIi0iOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyBjYXJkID0gInsgXCJuYW1lXCI6XCIiICsgbmkuTmFtZS5SZXBsYWNlKCJcIiwgIiciKSArICJcIiwgXCJpcFwiOlwidSIgKyBpcC5BZGRyZXNzLlRvU3RyaW5nKCkgKyAiXCIsIFwibWFza1wiOlwidSIgKyBpcC5JUHY0TWFzay5Ub1N0cmluZygpICsgIlwiLCBcImd3XCI6XCIiICsgZ3cgKyAiXCIgfSI7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZEpzb25zLkFkZChjYXJkKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIH0KCiAgICAgICAgICAgICAgICBzdHJpbmcgYm9keSA9ICJ7IFwiaWRcIjpcIiIgKyBkZXZpY2VJZCArICJcIiwgXCJkaXNrXCI6XCIiICsgZGlzayArICJcIiwgXCJob3N0bmFtZVwiOlwidSIgKyBFbnZpcm9ubWVudC5NYWNoaW5lTmFtZSArICJcIiwgXCJvc1wiOlwid2luZG93c1wiLCBcIm5ldHdvcmtcIjpbIiArIHN0cmluZy5Kb2luKCIsIiwgY2FyZEpzb25zLlRvQXJyYXkoKSkgKyAiXSB9IjsKICAgICAgICAgICAgICAgIGNsaWVudC5IZWFkZXJzW0h0dHBSZXF1ZXN0SGVhZGVyLkNvbnRlbnRUeXBlXSA9ICJhcHBsaWNhdGlvbi9qc29uIjsKICAgICAgICAgICAgICAgIHN0cmluZyByZXMgPSBjbGllbnQuVXBsb2FkU3RyaW5nKHNlcnZlclVybCwgIlBPU1QiLCBib2R5KTsKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgaWYgKHJlcy5Db250YWlucyhcIlwiY29tbWFuZFwiOlwiXCIpICYmICFyZXMuQ29udGFpbnMoXCJcImNvbW1hbmRcIjpudWxsXCIpKSB7CiAgICAgICAgICAgICAgICAgICAgc3RyaW5nIGNtZCA9IHJlcy5TcGxpdChuZXcgc3RyaW5nW10geyBcIlwiY29tbWFuZFwiOlwiXCIgfSwgU3RyaW5nU3BsaXRPcHRpb25zLk5vbmUpWzFdLlNwbGl0KCciJylbMF07CiAgICAgICAgICAgICAgICAgICAgc3RyaW5nIG91dHB1dCA9ICIiOwogICAgICAgICAgICAgICAgICAgIGlmIChjbWQgPT0gInRzZGlzY29uIiB8fCBjbWQgPT0gImxvY2siKSB7IFByb2Nlc3MuU3RhcnQoQCJDOlxXaW5kb3dzXFN5c3RlbTMyXHRzZGlzY29uLmV4ZSIpOyBvdXRwdXQgPSAiTG9ja2VkIjsgfQogICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNtZC5Db250YWlucygic2h1dGRvd24gL3MiKSkgeyBQcm9jZXNzLlN0YXJ0KCJzaHV0ZG93bi5leGUiLCAiL3MgL3QgNSAvZiIpOyBvdXRwdXQgPSAiU2h1dHRpbmcgZG93bi4uLiI7IH0KICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjbWQuQ29udGFpbnMoInNodXRkb3duIC9yIikpIHsgUHJvY2Vzcy5TdGFydCgic2h1dGRvd24uZXhlIiwgIi9yIC90IDUgL2YiKTsgb3V0cHV0ID0gIlJlc3RhcnRpbmcuLi4iOyB9CiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY21kICE9ICJyZWZyZXNoX2luZm8iKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9jZXNzU3RhcnRJbmZvIHBzaSA9IG5ldyBQcm9jZXNzU3RhcnRJbmZvKCJjbWQuZXhlIiwgIi9jICIgKyBjbWQpOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgcHNpLlJlZGlyZWN0U3RhbmRhcmRPdXRwdXQgPSB0cnVlOyBwc2kuUmVkaXJlY3RTdGFuZGFyZEVycm9yID0gdHJ1ZTsgcHNpLlVzZVNoZWxsRXhlY3V0ZSA9IGZhbHNlOyBwc2kuQ3JlYXRlTm9XaW5kb3cgPSB0cnVlOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNpbmcgKHZhciBwID0gUHJvY2Vzcy5TdGFydChwc2kpKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0ID0gcC5TdGFuZGFyZE91dHB1dC5SZWFkVG9FbmQoKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgZXJyID0gcC5TdGFuZGFyZEVycm9yLlJlYWRUb0VuZCgpOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3RyaW5nLklzTnVsbE9yRW1wdHkoZXJyKSkgb3V0cHV0ICs9ICIgRXJyb3I6ICIgKyBlcnI7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5XYWl0Rm9yRXhpdCgxNTAwMCk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKEV4Y2VwdGlvbiBleCkgeyBvdXRwdXQgPSAiRXJyb3I6ICIgKyBleC5NZXNzYWdlOyB9CiAgICAgICAgICAgICAgICAgICAgfQoKICAgICAgICAgICAgICAgICAgICBpZiAoIXN0cmluZy5Jc051bGxPckVtcHR5KG91dHB1dCkpIHsKICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nIGI2NCA9IENvbnZlcnQuVG9CYXNlNjRTdHJpbmcoRW5jb2RpbmcuVVRGOC5HZXRCeXRlcyhvdXRwdXQpKTsKICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nIHJCb2R5ID0gIkeyBcImRldmljZUlkXCI6XCIiICsgZGV2pY2VJZCArICJcIiwgXCJvdXRwdXRcIjpcIiIgKyBiNjQgKyAiXCIsIFwiaXNCYXNlNjRcIjogdHJ1ZSB9IjsKICAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50LkhlYWRlcnNbSHR0cFJlcXVlc3RIZWFkZXIuQ29udGVudFR5cGVdID0gImFwcGxpY2F0aW9uL2pzb24iOwogICAgICAgICAgICAgICAgICAgICAgICBjbGllbnQuVXBsb2FkU3RyaW5nKHJlc3VsdFVybCwgIlBPU1QiLCByQm9keSk7CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9IGNhdGNoIHt9CiAgICAgICAgICAgIFRocmVhZC5TbGVlcCgxMDAwMCk7CiAgICAgICAgfQogICAgfQp9";

    // Dinamik PowerShell Scripti
    const psScript = `# --- RUSTDESK RMM MASTER INSTALLER ---
# Otomatik olusturuldu: ${new Date().toLocaleString("tr-TR")}

$ErrorActionPreference = "SilentlyContinue"
$targetHost = "${host}"
$targetPort = "${port}"
$serverUrl = "${fullServerUrl}"
$serverKey = "${serverKey}"
$defPass = "${defaultPassword}"

Write-Host "--- RustDesk RMM Kurulumu Baslatiliyor ---" -ForegroundColor Yellow

# 1. Klasorleri Hazirla
$dir = "C:\\ProgramData\\RustDeskRMM"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }

# 2. RustDesk 1.4.6 İndir ve Servis Olarak Kur
$rdVersion = "1.4.6"
$rdUrl = "https://github.com/rustdesk/rustdesk/releases/download/$rdVersion/rustdesk-$rdVersion-x86_64.exe"
$rdFilename = "rustdesk-host=$($targetHost)-key=$($serverKey).exe"
$rdPath = Join-Path $env:TEMP "$rdFilename"

Write-Host ">> RustDesk $rdVersion indiriliyor..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $rdUrl -OutFile $rdPath -UseBasicParsing

Write-Host ">> Servis kurulumu baslatiliyor (Sessiz)..." -ForegroundColor Cyan
taskkill /F /IM RustDesk.exe /T 2>$null
Start-Sleep -Seconds 2

Start-Process $rdPath -ArgumentList "--silent-install"

# Servisin kurulmasını bekle
$waitTimeout = 20
while (!(Get-Service "rustdesk" -ErrorAction SilentlyContinue) -and $waitTimeout -gt 0) {
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
    $waitTimeout--
}
Write-Host ""

# Şifre Belirle
if ($defPass) {
    Write-Host ">> Baglanti sifresi tanimlaniyor ($defPass)..." -ForegroundColor Cyan
    $rdExe = "C:\\Program Files\\RustDesk\\rustdesk.exe"
    if (Test-Path $rdExe) {
        # Farkli parametreleri dene - Arkaplanda calistir
        Start-Process $rdExe -ArgumentList "--set-password", "$defPass" -WindowStyle Hidden
        Start-Sleep -Seconds 1
        Start-Process $rdExe -ArgumentList "--password", "$defPass" -WindowStyle Hidden
        Write-Host ">> Sifre komutları arkaplanda gonderildi." -ForegroundColor Green
    }
}

# 3. Konfigürasyon Dosyasını Oluştur
Write-Host ">> Sunucu ayarları sisteme işleniyor..." -ForegroundColor Cyan

$tomlContent = "id-server = '$targetHost'\`nrelay-server = '$targetHost'\`napi-server = 'http://$targetHost:3000'\`nkey = '$serverKey'"

# Servisi durdur ki dosyalar kilitli kalmasın
Stop-Service "rustdesk" -ErrorAction SilentlyContinue
taskkill /F /IM RustDesk.exe /T 2>$null
Start-Sleep -Seconds 2

$configPaths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config",
    "C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config",
    "$env:AppData\\RustDesk\\config",
    "$env:ProgramData\\RustDesk\\config"
)

foreach ($path in $configPaths) {
    if (!(Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force }
    $tomlContent | Set-Content -Path "$path\\RustDesk.toml" -Force
    $tomlContent | Set-Content -Path "$path\\rustdesk.toml" -Force
    $tomlContent | Set-Content -Path "$path\\RustDesk2.toml" -Force
}

# RustDesk CLI ile konfigürasyonu zorla uygula
$rdExe = "C:\\Program Files\\RustDesk\\rustdesk.exe"
if (Test-Path $rdExe) {
    Write-Host ">> Konfigurasyon CLI uzerinden zorlaniyor..." -ForegroundColor Cyan
    Start-Process $rdExe -ArgumentList "--config", "$tomlContent" -WindowStyle Hidden -Wait
}

Start-Service "rustdesk" -ErrorAction SilentlyContinue
Write-Host ">> Ayarlar uygulandı." -ForegroundColor Green

# 4. RMM Ajanini Kur
Write-Host ">> RMM Ajani yapılandırılıyor..." -ForegroundColor Cyan

$rdId = ""
$possiblePaths = @(
    "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Roaming\\RustDesk\\config\\RustDesk.toml",
    "$env:ProgramData\\RustDesk\\config\\RustDesk.toml",
    "$env:AppData\\RustDesk\\config\\RustDesk.toml"
)

function Get-RustDeskID {
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $content = Get-Content $p -Raw -ErrorAction SilentlyContinue
            if ($content -match "id\s*=\s*'(\d+)'") { return $matches[1] }
            if ($content -match "id\s*=\s*\"\"(\d+)\"\"") { return $matches[1] }
        }
    }
    if (Test-Path "C:\\Program Files\\RustDesk\\rustdesk.exe") {
        $cmdId = & "C:\\Program Files\\RustDesk\\rustdesk.exe" --get-id 2>$null
        if ($cmdId -match "^\d+$") { return $cmdId }
    }
    return ""
}

$rdId = Get-RustDeskID
if (-not $rdId) {
    Write-Host ">> ID bekleniyor..." -ForegroundColor Yellow
    Start-Process "C:\\Program Files\\RustDesk\\rustdesk.exe" --ArgumentList "--service" -WindowStyle Hidden -ErrorAction SilentlyContinue
    $timeout = 20
    while (-not $rdId -and $timeout -gt 0) {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        $rdId = Get-RustDeskID
        $timeout--
    }
    Write-Host ""
}

$agentId = if ($rdId) { $rdId } else { "0" }

# Agent Kaynak Kodu (Base64 ile guvenli aktarim)
$base64 = "${base64Agent}"
$source = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64))
$source = $source.Replace("[[SERVER_URL]]", $serverUrl).Replace("[[AGENT_ID__]]", $agentId)
$source | Out-File -FilePath "$dir\\Agent.cs" -Encoding utf8 -Force

# Derleme ve Servis Kaydı
$csc = (Get-ChildItem "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.*\\csc.exe" | Select-Object -First 1).FullName
taskkill /F /IM RustDeskRMM.exe /T 2>$null
& $csc /out:"$dir\\RustDeskRMM.exe" /target:winexe "$dir\\Agent.cs"

# Gorev Zamanlayici Olarak Ekle
$taskName = "RustDeskRMM_Service"
$action = New-ScheduledTaskAction -Execute "$dir\\RustDeskRMM.exe"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
Start-ScheduledTask -TaskName $taskName

Write-Host "------------------------------------------------" -ForegroundColor Yellow
Write-Host "BAŞARILI: RustDesk ve RMM Ajani Kuruldu! ✅" -ForegroundColor Green
Write-Host "Cihaz simdi Dashboard uzerinde gorunmelidir." -ForegroundColor Gray
Write-Host "BİTTİ" -ForegroundColor White -BackgroundColor Green
`;

    return new Response(psScript, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="install.ps1"'
      }
    });

  } catch (error: any) {
    console.error("Install Error:", error);
    return NextResponse.json({ error: "Script olusturulamadi: " + error.message }, { status: 500 });
  }
}
