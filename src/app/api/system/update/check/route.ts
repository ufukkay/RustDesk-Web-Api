import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
  try {
    // GitHub'dan son bilgileri çek
    execSync("git fetch origin main");
    
    // Yerel sürüm ile uzak sürüm arasındaki farkı kontrol et
    const local = execSync("git rev-parse HEAD").toString().trim();
    const remote = execSync("git rev-parse origin/main").toString().trim();

    const hasUpdate = local !== remote;

    return NextResponse.json({ 
      hasUpdate,
      message: hasUpdate ? "Yeni güncelleme bulundu!" : "Sisteminiz zaten güncel."
    });
  } catch (error: any) {
    console.error("Güncelleme kontrol hatası:", error);
    return NextResponse.json({ hasUpdate: false, error: error.message });
  }
}
