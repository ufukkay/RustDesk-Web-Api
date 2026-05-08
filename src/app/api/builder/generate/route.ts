import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { companyName, host, port, serverKey } = await req.json();

    if (!companyName) {
      return NextResponse.json({ error: "Şirket adı zorunludur." }, { status: 400 });
    }

    // Dosya adında soruna yol açmayacak güvenli isim
    const safeCompanyName = companyName.replace(/[^a-zA-Z0-9 ğüşöçİĞÜŞÖÇ]/g, "");
    
    // Orijinal agent scriptini oku
    const agentScriptPath = path.join(process.cwd(), "scripts", "agent", "setup.ps1");
    let agentScript = "";
    
    if (fs.existsSync(agentScriptPath)) {
      agentScript = fs.readFileSync(agentScriptPath, "utf-8");
      
      // Script içindeki statik URL'yi dinamik host/port ile değiştir
      const protocol = port === "443" ? "https" : "http";
      const baseUrl = `${protocol}://${host}:${port}`;
      
      // "https://rmm.talay.com" olan yerleri güncel adres ile değiştir
      agentScript = agentScript.replace(/https:\/\/rmm\.talay\.com/g, baseUrl);
    } else {
      console.warn("Ana agent scripti bulunamadı:", agentScriptPath);
      // Geri dönüş olarak minimal bir script ekle
      agentScript = `Write-Host "RMM Agent dosyası bulunamadı." -ForegroundColor Red`;
    }

    // Nihai özel PowerShell scriptini oluştur
    const customScript = `
# --- ${safeCompanyName.toUpperCase()} UZAKTAN DESTEK KURULUMU ---
# Bu script RustDesk'i kurar, yapılandırır ve RMM Ajanını başlatır.

Write-Host "=> ${safeCompanyName} Uzaktan Destek kurulumu basliyor..." -ForegroundColor Cyan

# 1. Yönetici Yetkisi Kontrolü
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Lutfen bu dosyaya sag tiklayip 'PowerShell ile Calistir' dedikten sonra gelen uyariya EVET deyin veya Yonetici (Admin) olarak calistirin."
    Start-Sleep -Seconds 5
    exit
}

# 2. RustDesk'i Indir
$rdUrl = "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe"
$rdPath = "$env:TEMP\\rustdesk_installer.exe"
Write-Host "=> [1/4] Uzaktan baglanti programi indiriliyor..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $rdUrl -OutFile $rdPath

# 3. RustDesk'i Kur (Sessiz Kurulum)
Write-Host "=> [2/4] Sisteme entegre ediliyor..." -ForegroundColor Yellow
$installProcess = Start-Process -FilePath $rdPath -ArgumentList "--silent-install" -PassThru -Wait -WindowStyle Hidden

# 4. Yapilandirma (Config & Sunucu Ayarlari)
Write-Host "=> [3/4] Sunucu baglantilari ayarlaniyor..." -ForegroundColor Yellow
$configDir = "$env:ProgramData\\RustDesk\\config"
if (!(Test-Path $configDir)) { New-Item -ItemType Directory -Path $configDir -Force }

# Gecikme: Kurulumun tam bitmesi icin biraz bekle
Start-Sleep -Seconds 5 

$configContent = @"
custom-rendezvous-server = '${host}'
key = '${serverKey}'
api-server = '${port === "443" ? "https" : "http"}://${host}:${port}'
"@
$configContent | Out-File -FilePath "$configDir\\RustDesk.toml" -Encoding utf8 -Force

# Masaustu Kisayolunu Kuruma Ozel Isimlendir
$desktopPath = [Environment]::GetFolderPath("Desktop")
$oldShortcut = "$desktopPath\\RustDesk.lnk"
$newShortcut = "$desktopPath\\${safeCompanyName} Destek.lnk"
if (Test-Path $oldShortcut) {
    Rename-Item -Path $oldShortcut -NewName "${safeCompanyName} Destek.lnk" -Force
}

# Ayarlari okumasi icin RustDesk servisini yeniden baslat
Restart-Service -Name "RustDesk" -ErrorAction SilentlyContinue

# 5. RMM Agent Kurulumu
Write-Host "=> [4/4] Arka plan RMM servisi baslatiliyor..." -ForegroundColor Yellow
${agentScript}

Write-Host "------------------------------------------------------" -ForegroundColor Green
Write-Host " KURULUM BASARILA TAMAMLANDI! " -ForegroundColor Green
Write-Host " Masaustunuzdeki '${safeCompanyName} Destek' ikonundan ulasabilirsiniz." -ForegroundColor White
Write-Host "------------------------------------------------------" -ForegroundColor Green
Start-Sleep -Seconds 5
`;

    // Header'da Türkçe karakter sorununu önlemek için sadece ASCII karakterli bir dosya adı üret
    const downloadFileName = safeCompanyName
      .replace(/[ığüşöçİĞÜŞÖÇ]/g, (m: string) => (({'ı':'i','ğ':'g','ü':'u','ş':'s','ö':'o','ç':'c','İ':'I','Ğ':'G','Ü':'U','Ş':'S','Ö':'O','Ç':'C'} as any)[m] || m))
      .replace(/\s+/g, '_') + "_Destek.ps1";

    return new Response(customScript, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream; charset=utf-8",
        "Content-Disposition": `attachment; filename="${downloadFileName}"`
      }
    });

  } catch (error: any) {
    console.error("Builder API Error Details:", error);
    return new Response(JSON.stringify({ 
      error: "Paket uretilirken hata olustu", 
      details: error.message,
      stack: error.stack 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
