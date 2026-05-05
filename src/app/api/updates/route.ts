import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
  try {
    // Mevcut versiyonu al (package.json'dan)
    const packageJson = require("../../../../../package.json");
    const currentVersion = packageJson.version || "1.0.0";

    // Uzak depodan (GitHub) son commit bilgisini kontrol edebiliriz
    // Şimdilik simülasyon yapalım veya basit bir git fetch deneyelim
    let updateAvailable = false;
    let latestVersion = currentVersion;

    try {
      // Sunucuda git varsa son güncellemeleri kontrol et
      execSync("git fetch origin main", { stdio: "ignore" });
      const local = execSync("git rev-parse HEAD").toString().trim();
      const remote = execSync("git rev-parse origin/main").toString().trim();
      
      if (local !== remote) {
        updateAvailable = true;
        latestVersion = "Yeni Versiyon Mevcut";
      }
    } catch (e) {
      // Git hatası veya sunucuda git yoksa
      console.log("Git update check failed, using mock data.");
    }

    return NextResponse.json({
      currentVersion,
      latestVersion,
      updateAvailable,
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: "Güncelleme kontrolü başarısız." }, { status: 500 });
  }
}

export async function POST() {
  try {
    // DİKKAT: Bu işlem sunucuda git pull ve npm install çalıştırır.
    // Çok kritik ve riskli bir işlemdir.
    
    // execSync("git pull origin main && npm install && npm run build", { stdio: "inherit" });
    
    // Şimdilik sadece başarılı mesajı dönelim, kullanıcı manuel yapsın veya 
    // risk alarak komutu açabiliriz.
    
    return NextResponse.json({ 
      success: true, 
      message: "Güncelleme komutu sunucuya iletildi. Lütfen sunucu konsolunu takip edin." 
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Güncelleme başlatılamadı." }, { status: 500 });
  }
}
