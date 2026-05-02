import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

function getDeviceIp(deviceId: string): string {
  let deviceIp = "";
  if (fs.existsSync(INFO_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8"));
      const info = data[String(deviceId)];
      if (info) deviceIp = (info.ip || "").replace(/^::ffff:/, "");
    } catch (e) {}
  }
  if (!deviceIp) {
    try {
      const dbPath = "/home/rd/rustdesk/db_v2.sqlite3";
      const output = execSync(`sqlite3 ${dbPath} "SELECT info FROM peer WHERE id='${deviceId}'" 2>/dev/null`).toString().trim();
      if (output) {
        const parsed = JSON.parse(output);
        deviceIp = (parsed.ip || "").replace(/^::ffff:/, "");
      }
    } catch (e) {}
  }
  return deviceIp;
}

// Ortak Komut Çalıştırma Fonksiyonu (WinRM -> SSH)
function runRemoteCommand(ip: string, cmd: string): { success: boolean, output: string } {
  // 1. WinRM (PowerShell) Dene
  try {
    const psCmd = `pwsh -Command "Invoke-Command -ComputerName ${ip} -ScriptBlock { ${cmd.replace(/"/g, '\\"')} } -ErrorAction Stop" 2>&1`;
    const output = execSync(psCmd, { timeout: 15000 }).toString();
    return { success: true, output };
  } catch (e) {
    // 2. SSH Dene
    try {
      const sshCmd = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${ip} "${cmd.replace(/"/g, '\\"')}" 2>&1`;
      const output = execSync(sshCmd, { timeout: 15000 }).toString();
      return { success: true, output };
    } catch (e2) {
      return { success: false, output: "WinRM ve SSH bağlantısı kurulamadı." };
    }
  }
}

export async function POST(req: Request) {
  try {
    const { deviceId, action, command } = await req.json();
    if (!deviceId) return NextResponse.json({ success: false, message: "Cihaz ID gerekli." });

    const deviceIp = getDeviceIp(deviceId);
    if (!deviceIp) return NextResponse.json({ success: false, message: "Cihaz IP'si bulunamadı." });

    let result = { success: false, output: "", message: "" };

    switch (action) {
      case "restart":
        const resRestart = runRemoteCommand(deviceIp, "shutdown /r /t 5 /f");
        result = { success: resRestart.success, output: resRestart.output, message: resRestart.success ? "Cihaz yeniden başlatılıyor..." : resRestart.output };
        break;

      case "shutdown":
        const resShutdown = runRemoteCommand(deviceIp, "shutdown /s /t 5 /f");
        result = { success: resShutdown.success, output: resShutdown.output, message: resShutdown.success ? "Cihaz kapatılıyor..." : resShutdown.output };
        break;

      case "lock":
        const resLock = runRemoteCommand(deviceIp, "rundll32.exe user32.dll,LockWorkStation");
        result = { success: resLock.success, output: resLock.output, message: resLock.success ? "Ekran kilitlendi." : resLock.output };
        break;

      case "refresh":
        const collectCmd = `$disk = (Get-CimInstance Win32_LogicalDisk | Where-Object {$_.DeviceID -eq 'C:'}); $diskSpace = \"{0:N1} GB / {1:N1} GB\" -f ($disk.FreeSpace/1GB), ($disk.Size/1GB); $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike '*Loopback*'}).IPAddress[0]; $os = (Get-CimInstance Win32_OperatingSystem).Caption; Invoke-RestMethod -Method Post -Uri 'http://192.168.0.184:3000/api/heartbeat' -Body (@{id='${deviceId}'; disk=$diskSpace; ip=$ip; os=$os} | ConvertTo-Json)`;
        const resRefresh = runRemoteCommand(deviceIp, collectCmd);
        result = { success: resRefresh.success, output: resRefresh.output, message: resRefresh.success ? "Bilgiler güncellendi." : resRefresh.output };
        break;

      case "terminal":
        if (!command) return NextResponse.json({ success: false, message: "Komut yok." });
        const resTerm = runRemoteCommand(deviceIp, command);
        result = { success: resTerm.success, output: resTerm.output, message: "" };
        break;

      default:
        result = { success: false, output: "", message: "Bilinmeyen aksiyon." };
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, message: "Sunucu hatası." });
  }
}
