import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

function getDeviceIp(deviceId: string): string {
  let deviceIp = "";
  
  // device_info.json'dan IP çek
  if (fs.existsSync(INFO_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8"));
      const info = data[String(deviceId)];
      if (info) {
        deviceIp = (info.ip || "").replace(/^::ffff:/, "");
      }
    } catch (e) {}
  }

  // Veritabanından IP çek (yedek)
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

export async function POST(req: Request) {
  try {
    const { deviceId, action, command } = await req.json();

    if (!deviceId) {
      return NextResponse.json({ success: false, message: "Cihaz ID gerekli.", output: "" });
    }

    const deviceIp = getDeviceIp(deviceId);

    let result = { success: false, output: "", message: "" };

    switch (action) {
      case "restart":
        if (!deviceIp) {
          result = { success: false, output: "", message: "Cihaz IP bulunamadı." };
        } else {
          // Önce SSH dene, başarısız olursa bilgilendir
          try {
            const output = execSync(
              `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 ${deviceIp} "shutdown /r /t 5 /f" 2>&1`,
              { timeout: 8000 }
            ).toString();
            result = { success: true, output, message: "Yeniden başlatma komutu gönderildi." };
          } catch (e) {
            result = { success: false, output: "", message: `SSH bağlantısı kurulamadı (${deviceIp}). Cihazda OpenSSH etkin olmayabilir. RustDesk üzerinden bağlanıp komutu elle çalıştırabilirsiniz.` };
          }
        }
        break;

      case "shutdown":
        if (!deviceIp) {
          result = { success: false, output: "", message: "Cihaz IP bulunamadı." };
        } else {
          try {
            const output = execSync(
              `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 ${deviceIp} "shutdown /s /t 5 /f" 2>&1`,
              { timeout: 8000 }
            ).toString();
            result = { success: true, output, message: "Kapatma komutu gönderildi." };
          } catch (e) {
            result = { success: false, output: "", message: `SSH bağlantısı kurulamadı (${deviceIp}). RustDesk üzerinden bağlanıp komutu elle çalıştırabilirsiniz.` };
          }
        }
        break;

      case "lock":
        if (!deviceIp) {
          result = { success: false, output: "", message: "Cihaz IP bulunamadı." };
        } else {
          try {
            const output = execSync(
              `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 ${deviceIp} "rundll32.exe user32.dll,LockWorkStation" 2>&1`,
              { timeout: 8000 }
            ).toString();
            result = { success: true, output, message: "Ekran kilitleme komutu gönderildi." };
          } catch (e) {
            result = { success: false, output: "", message: `SSH bağlantısı kurulamadı (${deviceIp}).` };
          }
        }
        break;

      case "terminal":
        if (!command) {
          result = { success: false, output: "", message: "Komut belirtilmedi." };
          break;
        }

        const cmd = command.trim();

        // Tehlikeli komutları engelle
        const dangerousPatterns = ["rm -rf", "mkfs", "dd if=", ":(){ :|:", "> /dev/", "format c:", "del /f /s /q c:\\"];
        if (dangerousPatterns.some(p => cmd.toLowerCase().includes(p))) {
          result = { success: false, output: "", message: "Bu komut güvenlik nedeniyle engellendi." };
          break;
        }

        // Önce uzak Windows cihazına WinRM ile bağlanmayı dene
        if (deviceIp) {
          try {
            // PowerShell WinRM üzerinden uzak komut çalıştır
            const psCmd = `powershell -Command "Invoke-Command -ComputerName ${deviceIp} -ScriptBlock { ${cmd.replace(/"/g, '\\"')} } -ErrorAction Stop" 2>&1`;
            const remoteOutput = execSync(psCmd, { timeout: 15000 }).toString();
            result = { 
              success: true, 
              output: remoteOutput || "(Çıktı yok)",
              message: "" 
            };
            break;
          } catch (winrmErr: any) {
            // WinRM başarısız - SSH'ı dene
            try {
              const sshOutput = execSync(
                `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${deviceIp} "${cmd.replace(/"/g, '\\"')}" 2>&1`,
                { timeout: 15000 }
              ).toString();
              result = { 
                success: true, 
                output: sshOutput || "(Çıktı yok)",
                message: "" 
              };
              break;
            } catch (sshErr: any) {
              // Her iki yöntem de başarısız
              // Sunucuda çalıştır ama bunu açıkça belirt
              const winToLinux: Record<string, string> = {
                "ipconfig": "ip -4 addr show",
                "ipconfig /all": "ip addr show",
                "tasklist": "ps aux --sort=-%mem | head -30",
                "systeminfo": "hostnamectl && echo '' && uname -a && echo '' && free -h && echo '' && df -h /",
                "dir": "ls -la",
                "netstat": "ss -tulpn",
                "netstat -ano": "ss -tulpn",
                "whoami": "whoami",
                "hostname": "hostname",
                "ver": "uname -a",
                "set": "env | sort | head -30",
                "sc query": "systemctl list-units --type=service --state=running | head -20",
                "ping": `ping -c 4 ${deviceIp}`,
                "status": "uptime && free -h && df -h /",
                "ports": "ss -tulpn | grep -E '21115|21116|21117|3000'",
                "logs": "journalctl -u rustdesk-hbbs --no-pager -n 20",
                "help": `echo "Uzak cihaza (${deviceIp}) bağlanılamadı. WinRM veya SSH etkin değil."`,
              };

              const translated = winToLinux[cmd.toLowerCase()] || cmd;
              
              try {
                const fallbackOutput = execSync(`${translated} 2>&1`, { timeout: 10000, cwd: "/home/rd" }).toString();
                result = {
                  success: true,
                  output: `⚠️  UYARI: Uzak cihaza (${deviceIp}) bağlanılamadı.\nWinRM veya SSH etkin değil. Aşağıdaki çıktı SUNUCUDAN alındı:\n\n${fallbackOutput}`,
                  message: ""
                };
              } catch (fallbackErr: any) {
                result = {
                  success: false,
                  output: `❌ Uzak cihaza bağlanılamadı: ${deviceIp}\n\nNeden?\n• WinRM (PowerShell Remoting) etkin değil\n• SSH sunucusu kurulu değil\n\nÇözüm: Hedef Windows cihazında PowerShell'i Yönetici olarak açıp şunu çalıştırın:\nEnable-PSRemoting -Force\nSet-Item WSMan:\\localhost\\Client\\TrustedHosts -Value "${deviceIp}"`,
                  message: ""
                };
              }
              break;
            }
          }
        } else {
          result = {
            success: false,
            output: "❌ Cihaz IP adresi bulunamadı. Cihaz çevrimdışı olabilir.",
            message: ""
          };
        }
        break;

      default:
        result = { success: false, output: "", message: `Bilinmeyen aksiyon: ${action}` };
    }

    console.log(`[COMMAND] Device: ${deviceId}, Action: ${action}, Success: ${result.success}`);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Command API Error:", error);
    return NextResponse.json({ success: false, message: "Sunucu hatası.", output: "" });
  }
}
