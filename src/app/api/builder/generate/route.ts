import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export async function POST(req: Request) {
  const tmpDir = path.join("/tmp", `builder_${Date.now()}`);

  try {
    const { companyName, host, port, serverKey } = await req.json();

    if (!companyName) {
      return NextResponse.json({ error: "Şirket adı zorunludur." }, { status: 400 });
    }

    const safeCompanyName = companyName.replace(/[^a-zA-Z0-9 ğüşöçİĞÜŞÖÇ]/g, "");
    const asciiCompanyName = safeCompanyName
      .replace(/[ığüşöçİĞÜŞÖÇ]/g, (m: string) => (({'ı':'i','ğ':'g','ü':'u','ş':'s','ö':'o','ç':'c','İ':'I','Ğ':'G','Ü':'U','Ş':'S','Ö':'O','Ç':'C'} as any)[m] || m))
      .replace(/\s+/g, '_');

    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // 1. Agent scriptini oku ve özelleştir
    const agentScriptPath = path.join(process.cwd(), "scripts", "agent", "setup.ps1");
    let agentScript = "";
    if (fs.existsSync(agentScriptPath)) {
      agentScript = fs.readFileSync(agentScriptPath, "utf-8");
      const protocol = port === "443" ? "https" : "http";
      agentScript = agentScript.replace(/https:\/\/rmm\.talay\.com/g, `${protocol}://${host}:${port}`);
    }

    // 2. PowerShell scriptini oluştur (UTF-8 BOM + Windows satır sonu)
    const customScript = `
# --- ${safeCompanyName.toUpperCase()} UZAKTAN DESTEK KURULUMU ---
Write-Host "=> ${safeCompanyName} Uzaktan Destek kurulumu basliyor..." -ForegroundColor Cyan

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Lutfen Yonetici (Admin) olarak calistirin."
    Start-Sleep -Seconds 5
    exit
}

$rdUrl = "https://github.com/rustdesk/rustdesk/releases/download/1.4.6/rustdesk-1.4.6-x86_64.exe"
$rdPath = "$env:TEMP\\rustdesk_installer.exe"
Write-Host "=> [1/4] Program indiriliyor..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $rdUrl -OutFile $rdPath

Write-Host "=> [2/4] Kurulum yapiliyor..." -ForegroundColor Yellow
Start-Process -FilePath $rdPath -ArgumentList "--silent-install" -Wait -WindowStyle Hidden

Write-Host "=> [3/4] Yapilandiriliyor..." -ForegroundColor Yellow
$configDir = "$env:ProgramData\\RustDesk\\config"
if (!(Test-Path $configDir)) { New-Item -ItemType Directory -Path $configDir -Force }
Start-Sleep -Seconds 3
$configContent = @"
custom-rendezvous-server = '${host}'
key = '${serverKey}'
api-server = '${port === "443" ? "https" : "http"}://${host}:${port}'
"@
$configContent | Out-File -FilePath "$configDir\\RustDesk.toml" -Encoding utf8 -Force

$desktopPath = [Environment]::GetFolderPath("Desktop")
$oldShortcut = "$desktopPath\\RustDesk.lnk"
if (Test-Path $oldShortcut) { Rename-Item -Path $oldShortcut -NewName "${safeCompanyName} Destek.lnk" -Force }
Restart-Service -Name "RustDesk" -ErrorAction SilentlyContinue

Write-Host "=> [4/4] RMM servisi baslatiliyor..." -ForegroundColor Yellow
${agentScript}
Write-Host "KURULUM TAMAMLANDI!" -ForegroundColor Green
Start-Sleep -Seconds 3
`;

    const ps1Path = path.join(tmpDir, "setup.ps1");
    const ps1Content = Buffer.from("﻿" + customScript.replace(/\r?\n/g, "\r\n"), "utf-8");
    fs.writeFileSync(ps1Path, ps1Content);

    // 3. NSIS ile EXE oluştur
    // Ubuntu kurulum: sudo apt install nsis
    const exePath = path.join(tmpDir, `${asciiCompanyName}_Kurulum.exe`);

    const nsiContent = `Unicode true
Name "${safeCompanyName} Kurulumu"
OutFile "${exePath}"
RequestExecutionLevel admin
SilentInstall silent

Section
  SetOutPath "$PLUGINSDIR"
  File "${ps1Path}"
  ExecWait 'powershell.exe -ExecutionPolicy Bypass -WindowStyle Normal -File "$PLUGINSDIR\\setup.ps1"'
SectionEnd
`;

    const nsiPath = path.join(tmpDir, "installer.nsi");
    fs.writeFileSync(nsiPath, nsiContent, "utf-8");

    execSync(`makensis "${nsiPath}"`, { stdio: "pipe" });

    const exeBuffer = fs.readFileSync(exePath);
    cleanup(tmpDir);

    return new Response(exeBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${asciiCompanyName}_Kurulum.exe"`
      }
    });

  } catch (error: any) {
    console.error("Builder API Error:", error);
    if (typeof tmpDir !== 'undefined') cleanup(tmpDir);
    return new Response(JSON.stringify({ details: error.message || "Bilinmeyen bir hata oluştu" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

function cleanup(dir: string) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (e) {}
}
