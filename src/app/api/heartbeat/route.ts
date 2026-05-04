import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Dosya yolları tanımlamaları
 */
const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");
const QUEUE_FILE = path.join(process.cwd(), "scripts", "command_queue.json");

/**
 * POST /api/heartbeat
 * Cihazlardan (Agent) gelen sinyalleri yakalar.
 * 1. Cihazın durumunu ve donanım bilgilerini günceller.
 * 2. Cihaz için bekleyen bir komut varsa onu cihaza iletir.
 */
export async function POST(req: Request) {
  try {
    let body;
    try { body = await req.json(); } catch (e) { return NextResponse.json({ ok: true }); }

    const deviceId = body.id || body.uuid;
    if (!deviceId) return NextResponse.json({ ok: true });

    const deviceIdStr = String(deviceId);
    const now = Math.floor(Date.now() / 1000);

    // 0. Akıllı Kurtarma: Eğer cihaz blacklist'te ise ama sinyal gönderiyorsa, aktif demektir.
    // Sadece 5 dakikadan önce silinmiş cihazları otomatik geri getirelim (Hatalı silme koruması)
    const BLACKLIST_FILE = path.join(process.cwd(), "scripts", "blacklist.json");
    if (fs.existsSync(BLACKLIST_FILE)) {
      try {
        let blacklist = JSON.parse(fs.readFileSync(BLACKLIST_FILE, "utf-8"));
        const entry = blacklist[deviceIdStr];
        if (entry) {
          const deletedAt = entry.deleted_at || 0;
          // Eğer üzerinden 5 dakika (300 saniye) geçmişse ve hala sinyal varsa geri getir
          if (now - deletedAt > 300) {
            delete blacklist[deviceIdStr];
            fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2));
          } else {
            // Hala yasaklı sürede, işlemi durdur ve cihaza cevap verme (veya sessiz kal)
            return NextResponse.json({ ok: false, error: "Blacklisted" });
          }
        }
      } catch (e) {}
    }

    // 1. Durum (Online/Offline) ve Donanım Bilgilerini Güncelle
    let statusData: Record<string, number> = {};
    let infoData: Record<string, any> = {};
    
    if (fs.existsSync(STATUS_FILE)) { try { statusData = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8")); } catch (e) {} }
    if (fs.existsSync(INFO_FILE)) { try { infoData = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8")); } catch (e) {} }

    // 1. Akıllı İşaretleme ve Otomatik Birleştirme (Deduplication)
    if (body.hostname) {
      const isNumericId = /^\d+$/.test(deviceIdStr);
      
      Object.keys(infoData).forEach(existingId => {
        // Eğer aynı hostname'e sahip başka bir kayıt varsa (Büyük/Küçük harf duyarsız)
        if (existingId !== deviceIdStr && 
            infoData[existingId].hostname?.toUpperCase() === body.hostname?.toUpperCase()) {
          const isExistingNumeric = /^\d+$/.test(existingId);
          
          // Senaryo: Yeni gelen ID rakamsal (gerçek RustDesk ID) ama eski kayıt rakamsal değil (hostname ID)
          // Bu durumda eski kaydı tamamen temizleyelim veya "Eski" olarak işaretleyelim.
          if (isNumericId && !isExistingNumeric) {
            infoData[existingId].isDuplicate = true;
            // Eski kaydın verilerini yeniye aktarabiliriz (opsiyonel)
            delete statusData[existingId]; // Online listesinden çıkar
          } 
          // Eğer tam tersiyse (nadiren olur), yeni gelen geçicidir, ama biz yine de en günceli tutmak isteriz.
          else if (!isNumericId && isExistingNumeric) {
            // Bu durumda yeni geleni değil, mevcut rakamsal olanı tercih etmeliyiz.
            // Ama agent şu an bu ID ile geldiği için onu engellemek yerine "isDuplicate" işaretleyebiliriz.
            infoData[deviceIdStr].isDuplicate = true;
          }
        }
      });
      
      if (infoData[deviceIdStr]) {
        // Eğer bu ID daha önce duplicate işaretlendiyse ama şimdi ana ID olduysa temizle
        if (isNumericId) infoData[deviceIdStr].isDuplicate = false;
      }
    }

    // Son görülme zamanını kaydet
    statusData[deviceIdStr] = now;
    
    // Agent'tan gelen yeni bilgileri mevcut bilgilere ekle/güncelle
    if (!infoData[deviceIdStr]) infoData[deviceIdStr] = {};
    if (body.disk) infoData[deviceIdStr].disk = body.disk;
    if (body.ip) infoData[deviceIdStr].ip = body.ip;
    if (body.user) infoData[deviceIdStr].standard_user = body.user;
    if (body.gateway) infoData[deviceIdStr].gateway = body.gateway;
    if (body.dns) infoData[deviceIdStr].dns = body.dns;
    if (body.network) infoData[deviceIdStr].network = body.network; 
    if (body.hostname) infoData[deviceIdStr].hostname = body.hostname;
    if (body.cpu) infoData[deviceIdStr].cpu = body.cpu;
    if (body.ram) infoData[deviceIdStr].ram = body.ram;
    if (body.os) infoData[deviceIdStr].os = body.os;

    fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
    fs.writeFileSync(INFO_FILE, JSON.stringify(infoData, null, 2));

    // 2. Komut Kuyruğu Kontrolü
    // Sunucu tarafında bir teknisyen komut gönderdiyse, bu cihaz için kuyrukta bekleyen komutu bul.
    let pendingCommand = null;
    const hostname = (body.hostname || infoData[deviceIdStr]?.hostname || "").toUpperCase();
    if (hostname && fs.existsSync(QUEUE_FILE)) {
      try {
        let queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
        if (queue[hostname] && queue[hostname].length > 0) {
          pendingCommand = queue[hostname].shift(); 
          fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
        }
      } catch (e) {}
    }

    // Cihaza yanıt ver: İşlem başarılı ve (varsa) bekleyen komut budur.
    return NextResponse.json({ 
      ok: true, 
      command: pendingCommand 
    });

  } catch (error) {
    return NextResponse.json({ ok: true });
  }
}

/**
 * GET isteği varsayılan başarılı döner
 */
export async function GET() {
  return NextResponse.json({ ok: true });
}
