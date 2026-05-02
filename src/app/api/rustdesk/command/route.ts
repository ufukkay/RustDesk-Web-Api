import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function POST(req: Request) {
  try {
    const { deviceId, action, command } = await req.json();

    if (!deviceId) {
      return NextResponse.json({ success: false, message: "Cihaz ID gerekli." });
    }

    // Cihaz IP'sini bul
    let deviceIp = "";
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

    if (!deviceIp) {
      return NextResponse.json({ 
        success: false, 
        message: `Cihaz IP adresi bulunamadı. Cihaz çevrimdışı olabilir.` 
      });
    }

    let result = { success: false, output: "", message: "" };

    switch (action) {
      case "restart":
        // Windows: shutdown /r /t 5 /f
        try {
          const output = execSync(
            `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${deviceIp} "shutdown /r /t 5 /f" 2>&1 || echo "SSH bağlantısı kurulamadı. Alternatif: RustDesk üzerinden bağlanıp komutu çalıştırın."`,
            { timeout: 10000 }
          ).toString();
          result = { success: true, output, message: `${deviceId} yeniden başlatılıyor...` };
        } catch (e: any) {
          result = { success: false, output: "", message: `Yeniden başlatma komutu gönderilemedi. Alternatif: Uzaktan bağlanıp komutu elle çalıştırın.` };
        }
        break;

      case "shutdown":
        try {
          const output = execSync(
            `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${deviceIp} "shutdown /s /t 5 /f" 2>&1 || echo "SSH bağlantısı kurulamadı."`,
            { timeout: 10000 }
          ).toString();
          result = { success: true, output, message: `${deviceId} kapatılıyor...` };
        } catch (e: any) {
          result = { success: false, output: "", message: `Kapatma komutu gönderilemedi.` };
        }
        break;

      case "lock":
        try {
          const output = execSync(
            `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${deviceIp} "rundll32.exe user32.dll,LockWorkStation" 2>&1 || echo "SSH bağlantısı kurulamadı."`,
            { timeout: 10000 }
          ).toString();
          result = { success: true, output, message: `${deviceId} ekranı kilitleniyor...` };
        } catch (e: any) {
          result = { success: false, output: "", message: `Kilitleme komutu gönderilemedi.` };
        }
        break;

      case "terminal":
        if (!command) {
          result = { success: false, output: "", message: "Komut belirtilmedi." };
          break;
        }
        try {
          const output = execSync(
            `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${deviceIp} "${command.replace(/"/g, '\\"')}" 2>&1`,
            { timeout: 15000 }
          ).toString();
          result = { success: true, output: output || "(Çıktı yok)", message: "Komut başarıyla çalıştırıldı." };
        } catch (e: any) {
          result = { 
            success: false, 
            output: e.stdout?.toString() || e.stderr?.toString() || "Komut çalıştırılamadı. SSH bağlantısı mevcut olmayabilir.", 
            message: "Komut hatası." 
          };
        }
        break;

      default:
        result = { success: false, output: "", message: `Bilinmeyen aksiyon: ${action}` };
    }

    // Log kaydet
    console.log(`[COMMAND] Device: ${deviceId}, IP: ${deviceIp}, Action: ${action}, Success: ${result.success}`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Command API Error:", error);
    return NextResponse.json({ success: false, message: "Sunucu hatası.", output: "" });
  }
}
