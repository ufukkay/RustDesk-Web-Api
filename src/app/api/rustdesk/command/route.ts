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

        // Güvenli komut listesi - tehlikeli komutları engelle
        const dangerousPatterns = ["rm -rf", "mkfs", "dd if=", ":(){ :|:", "> /dev/"];
        if (dangerousPatterns.some(p => cmd.toLowerCase().includes(p))) {
          result = { success: false, output: "", message: "Bu komut güvenlik nedeniyle engellendi." };
          break;
        }

        // Özel komutlar
        if (cmd.startsWith("ping ") && !cmd.includes(deviceIp)) {
          // Normal ping komutu
          try {
            const output = execSync(`${cmd} -c 4 2>&1`, { timeout: 15000 }).toString();
            result = { success: true, output, message: "" };
          } catch (e: any) {
            result = { success: true, output: e.stdout?.toString() || "Ping başarısız.", message: "" };
          }
          break;
        }

        if (cmd === "ping" || cmd === "ping device") {
          // Cihaza ping at
          if (deviceIp) {
            try {
              const output = execSync(`ping -c 4 ${deviceIp} 2>&1`, { timeout: 15000 }).toString();
              result = { success: true, output: `Hedef: ${deviceIp}\n${output}`, message: "" };
            } catch (e: any) {
              result = { success: true, output: e.stdout?.toString() || `${deviceIp} adresine ulaşılamıyor.`, message: "" };
            }
          } else {
            result = { success: false, output: "", message: "Cihaz IP bulunamadı." };
          }
          break;
        }

        if (cmd === "status" || cmd === "durum") {
          // Sistem durumu
          try {
            const uptime = execSync("uptime 2>&1").toString().trim();
            const memory = execSync("free -h 2>&1 | head -3").toString().trim();
            const disk = execSync("df -h / 2>&1 | tail -1").toString().trim();
            const hbbs = execSync("systemctl is-active rustdesk-hbbs 2>&1").toString().trim();
            const hbbr = execSync("systemctl is-active rustdesk-hbbr 2>&1").toString().trim();
            
            result = { 
              success: true, 
              output: `=== SUNUCU DURUMU ===\n\nUptime: ${uptime}\n\nBellek:\n${memory}\n\nDisk: ${disk}\n\nHBBS: ${hbbs}\nHBBR: ${hbbr}`,
              message: "" 
            };
          } catch (e: any) {
            result = { success: true, output: e.stdout?.toString() || "Durum alınamadı.", message: "" };
          }
          break;
        }

        if (cmd === "help" || cmd === "yardım") {
          result = {
            success: true,
            output: `
╔══════════════════════════════════════════════╗
║        RustDesk Yönetim Terminali           ║
╠══════════════════════════════════════════════╣
║                                              ║
║  ÖZEL KOMUTLAR:                              ║
║  ─────────────────────────────────────────   ║
║  help / yardım    → Bu yardım mesajı        ║
║  status / durum   → Sunucu durumu            ║
║  ping             → Cihaza ping at           ║
║  ping <ip>        → Belirli IP'ye ping at    ║
║  ports            → Port durumları           ║
║  services         → Servis durumları         ║
║  logs             → Son hbbs logları         ║
║                                              ║
║  SUNUCU KOMUTLARI:                           ║
║  ─────────────────────────────────────────   ║
║  Standart Linux komutları çalıştırılabilir:  ║
║  ls, cat, top, df, free, netstat, vb.        ║
║                                              ║
╚══════════════════════════════════════════════╝`,
            message: ""
          };
          break;
        }

        if (cmd === "ports") {
          try {
            const output = execSync("ss -tulpn | grep -E '21115|21116|21117|21118|21119|3000' 2>&1").toString();
            result = { success: true, output: `=== AKTİF PORTLAR ===\n${output}`, message: "" };
          } catch (e: any) {
            result = { success: true, output: e.stdout?.toString() || "Port bilgisi alınamadı.", message: "" };
          }
          break;
        }

        if (cmd === "services" || cmd === "servisler") {
          try {
            const hbbs = execSync("systemctl status rustdesk-hbbs --no-pager -l 2>&1 | head -10").toString();
            const hbbr = execSync("systemctl status rustdesk-hbbr --no-pager -l 2>&1 | head -10").toString();
            result = { success: true, output: `=== HBBS ===\n${hbbs}\n=== HBBR ===\n${hbbr}`, message: "" };
          } catch (e: any) {
            result = { success: true, output: e.stdout?.toString() || "Servis bilgisi alınamadı.", message: "" };
          }
          break;
        }

        if (cmd === "logs") {
          try {
            const output = execSync("journalctl -u rustdesk-hbbs --no-pager -n 20 2>&1").toString();
            result = { success: true, output: `=== SON HBBS LOGLARI ===\n${output}`, message: "" };
          } catch (e: any) {
            result = { success: true, output: e.stdout?.toString() || "Log alınamadı.", message: "" };
          }
          break;
        }

        // Windows → Linux komut çevirisi
        const winToLinux: Record<string, string> = {
          "ipconfig": "ip -4 addr show | grep -E 'inet |^[0-9]' | awk '{print $0}'",
          "ipconfig /all": "ip addr show",
          "ipconfig/all": "ip addr show",
          "tasklist": "ps aux --sort=-%mem | head -30",
          "tasklist /svc": "ps aux --sort=-%mem",
          "systeminfo": "hostnamectl && echo '' && uname -a && echo '' && free -h && echo '' && df -h /",
          "dir": "ls -la /home/rd",
          "dir /s": "ls -laR /home/rd",
          "cls": "clear",
          "whoami": "whoami",
          "hostname": "hostname",
          "netstat": "ss -tulpn",
          "netstat -ano": "ss -tulpn",
          "netstat -an": "ss -an | head -40",
          "net user": "cat /etc/passwd | grep -v nologin | grep -v false",
          "ver": "uname -a",
          "type nul": "echo ''",
          "echo %username%": "echo $USER",
          "echo %computername%": "hostname",
          "set": "env | sort | head -40",
          "date": "date",
          "time": "date +%T",
          "shutdown /r /t 0": "echo 'Sunucu yeniden başlatma portaldan engellendi.'",
          "shutdown /s /t 0": "echo 'Sunucu kapatma portaldan engellendi.'",
          "sc query": "systemctl list-units --type=service --state=running | head -30",
          "diskpart": "echo 'diskpart Linux üzerinde desteklenmemektedir. Bunun yerine: lsblk'",
        };

        // Çeviri varsa uygula, yoksa direkt çalıştır
        const translatedCmd = winToLinux[cmd.toLowerCase()] || winToLinux[cmd] || cmd;
        const wasTranslated = translatedCmd !== cmd;

        // Genel sunucu komutu çalıştır
        try {
          const output = execSync(`${translatedCmd} 2>&1`, { timeout: 15000, cwd: "/home/rd" }).toString();
          const prefix = wasTranslated ? `[Windows komutu algılandı: "${cmd}" → Linux karşılığı çalıştırıldı]\n\n` : "";
          result = { success: true, output: prefix + (output || "(Çıktı yok)"), message: "" };
        } catch (e: any) {
          const errOutput = e.stdout?.toString() || e.stderr?.toString() || "";
          result = { 
            success: false, 
            output: errOutput || `Komut çalıştırılamadı: ${cmd}\nİpucu: "help" yazarak desteklenen komutları görebilirsiniz.`, 
            message: "Komut hatası." 
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
