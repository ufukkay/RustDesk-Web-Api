import { NextResponse } from "next/server";
import { execSync, exec } from "child_process";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Mevcut versiyonu al (package.json'dan)
    let currentVersion = "1.0.0";
    try {
      const packagePath = path.join(process.cwd(), "package.json");
      const packageData = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
      currentVersion = packageData.version || "1.0.0";
    } catch (e) {
      console.log("Could not read package.json version");
    }

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
    console.log("Güncelleme arka planda başlatılıyor (fix-all.sh)...");
    
    // Arka planda çalıştır (nohup ve & ile)
    // Bu sayede uygulama kapanmadan önce yanıt dönebiliriz.
    const command = "nohup ~/fix-all.sh > /dev/null 2>&1 &";
    
    exec(command);

    return NextResponse.json({ 
      success: true, 
      message: "Güncelleme arka planda başlatıldı. Sunucu birkaç dakika içinde yenilenmiş ve yeniden başlatılmış olacaktır. Lütfen 1-2 dakika sonra sayfayı yenileyin." 
    });
  } catch (error: any) {
    console.error("Güncelleme başlatma hatası:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Güncelleme başlatılamadı.",
      error: error.message
    }, { status: 500 });
  }
}
