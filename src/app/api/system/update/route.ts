import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // 1. Git pull - En son kodları çek
    console.log("Güncelleme başlatıldı: git pull...");
    await execAsync("git pull");

    // 2. Npm install - Yeni paketler varsa kur
    console.log("Paketler güncelleniyor: npm install...");
    await execAsync("npm install");

    // 3. Build - Projeyi derle (Bu kısım uzun sürebilir)
    console.log("Proje derleniyor: npm run build...");
    // Build işlemini asenkron başlatıp hemen yanıt dönebiliriz 
    // çünkü build sırasında bu process meşgul olacak.
    
    exec("npm run build && pm2 restart rustdesk-portal", (error) => {
      if (error) {
        console.error("Build veya Restart hatası:", error);
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Güncelleme başlatıldı. Panel birkaç dakika içinde yeniden başlayacak." 
    });
  } catch (error: any) {
    console.error("Güncelleme hatası:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
