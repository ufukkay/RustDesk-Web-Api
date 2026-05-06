import { NextResponse } from "next/server";
import { execSync } from "child_process";
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
    // DİKKAT: Bu işlem sunucuda git pull ve npm install çalıştırır.
    // Bu işlem uzun sürebilir ve sunucu kaynaklarını tüketebilir.
    
    console.log("Güncelleme başlatılıyor (fix-all.sh)...");
    
    // Kullanıcının önerdiği fix-all.sh scriptini çalıştır
    // ~/fix-all.sh genellikle /home/kullanıcı/fix-all.sh demektir.
    const command = "~/fix-all.sh";
    
    const output = execSync(command, { 
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 10 
    });
    
    console.log("Güncelleme çıktısı:", output);

    return NextResponse.json({ 
      success: true, 
      message: "Sistem başarıyla güncellendi ve yeniden derlendi. Değişikliklerin tam olarak yansıması için servisin restart edilmesi gerekebilir.",
      output: output.substring(0, 500) + "..." 
    });
  } catch (error: any) {
    console.error("Güncelleme hatası:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Güncelleme sırasında hata oluştu.",
      error: error.message,
      stderr: error.stderr?.toString()
    }, { status: 500 });
  }
}
