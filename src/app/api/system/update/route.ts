import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const projectRoot = process.cwd();
    const logFile = path.join(projectRoot, "update.log");
    
    // Log dosyasını temizle ve başlat
    fs.writeFileSync(logFile, `[${new Date().toISOString()}] Güncelleme başlatıldı...\n`);

    // Komutları birleştir (Ubuntu/Linux uyumlu)
    // git fetch ve reset kullanarak yerel çakışmaları önlüyoruz.
    const updateCommand = `
      git fetch --all && 
      git reset --hard origin/main && 
      npm install && 
      npm run build && 
      pm2 restart rustdesk-portal
    `.replace(/\n/g, " ");

    // Komutu arka planda (detached) çalıştır
    // İşlem bitince log dosyasına DEPLOY_COMPLETE yazdırıyoruz
    const fullCommand = `(${updateCommand} && echo "DEPLOY_COMPLETE" >> ${logFile}) > ${logFile} 2>&1 &`;

    exec(fullCommand, (error) => {
      if (error) {
        fs.appendFileSync(logFile, `[HATA] ${error.message}\n`);
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Güncelleme komutu başarıyla gönderildi. İşlem log dosyasından (update.log) takip edilebilir. Panel 1-2 dakika içinde güncellenip yeniden başlayacaktır." 
    });
  } catch (error: any) {
    console.error("Güncelleme API Hatası:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
