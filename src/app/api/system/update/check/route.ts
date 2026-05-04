import { NextResponse } from "next/server";
import { execSync } from "child_process";

let cachedStatus: any = null;
let lastCheckTime = 0;
const CACHE_TTL = 3600000; // 1 saat (60 * 60 * 1000)

export async function GET() {
  try {
    const now = Date.now();
    if (cachedStatus && (now - lastCheckTime < CACHE_TTL)) {
      return NextResponse.json(cachedStatus);
    }

    // GitHub'dan son bilgileri çek
    try {
      execSync("git fetch origin main");
    } catch (e) {
      // Git fetch hatası (bağlantı yok vs) olsa bile devam et, sadece uyarı ver.
    }
    
    // Yerel sürüm ile uzak sürüm arasındaki farkı kontrol et
    const local = execSync("git rev-parse HEAD").toString().trim();
    const remote = execSync("git rev-parse origin/main").toString().trim();

    const hasUpdate = local !== remote;

    cachedStatus = { 
      hasUpdate,
      message: hasUpdate ? "Yeni güncelleme bulundu!" : "Sisteminiz zaten güncel."
    };
    lastCheckTime = now;

    return NextResponse.json(cachedStatus);
  } catch (error: any) {
    console.error("Güncelleme kontrol hatası:", error);
    return NextResponse.json({ hasUpdate: false, error: error.message });
  }
}
