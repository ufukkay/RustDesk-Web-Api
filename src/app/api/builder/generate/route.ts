import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export async function POST(req: Request) {
  const tmpDir = path.join("/tmp", `builder_${Date.now()}`);

  try {
    const { companyName, host } = await req.json();

    if (!companyName) {
      return NextResponse.json({ error: "Şirket adı zorunludur." }, { status: 400 });
    }

    const safeCompanyName = companyName.replace(/[^a-zA-Z0-9 ğüşöçİĞÜŞÖÇ]/g, "");
    const asciiCompanyName = safeCompanyName
      .replace(/[ığüşöçİĞÜŞÖÇ]/g, (m: string) => (({'ı':'i','ğ':'g','ü':'u','ş':'s','ö':'o','ç':'c','İ':'I','Ğ':'G','Ü':'U','Ş':'S','Ö':'O','Ç':'C'} as any)[m] || m))
      .replace(/\s+/g, '_');

    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const installUrl = `https://${host}/api/rustdesk/builder/install?host=${host}&port=443`;

    // EXE sadece sunucudaki calistigindan emin olunan install API'sini cagirir
    const customScript = `
# --- ${safeCompanyName.toUpperCase()} UZAKTAN DESTEK KURULUMU ---
Write-Host "=> ${safeCompanyName} Uzaktan Destek kurulumu basliyor..." -ForegroundColor Cyan

if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Lutfen Yonetici (Admin) olarak calistirin."
    Start-Sleep -Seconds 5
    exit
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host ">> Sunucu: ${installUrl}" -ForegroundColor Gray
try {
    irm "${installUrl}" | iex
} catch {
    Write-Host "HATA: Kurulum scripti alinamadi - $($_.Exception.Message)" -ForegroundColor Red
    Start-Sleep -Seconds 10
    exit 1
}

$desktopPath = [Environment]::GetFolderPath("Desktop")
$oldShortcut = "$desktopPath\\RustDesk.lnk"
if (Test-Path $oldShortcut) {
    Rename-Item -Path $oldShortcut -NewName "${safeCompanyName} Destek.lnk" -Force
}

Start-Sleep -Seconds 3
`;

    const ps1Path = path.join(tmpDir, "setup.ps1");
    const ps1Content = Buffer.from("﻿" + customScript.replace(/\r?\n/g, "\r\n"), "utf-8");
    fs.writeFileSync(ps1Path, ps1Content);

    const exePath = path.join(tmpDir, `${asciiCompanyName}_Kurulum.exe`);

    const nsiContent = `Unicode true
!include "MUI2.nsh"

Name "${safeCompanyName} Kurulumu"
OutFile "${exePath}"
RequestExecutionLevel admin
ShowInstDetails show

!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Kurulum"
  CreateDirectory "$TEMP\\rd_setup"
  SetOutPath "$TEMP\\rd_setup"
  File "${ps1Path}"
  DetailPrint "Kurulum baslatiliyor..."
  nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NonInteractive -File "$TEMP\\rd_setup\\setup.ps1"'
  Pop $0
  IntCmp $0 0 done
    DetailPrint "HATA: Kurulum basarisiz oldu (kod: $0)"
  done:
  DetailPrint "Islem tamamlandi."
  RMDir /r "$TEMP\\rd_setup"
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
