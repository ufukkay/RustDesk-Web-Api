import { NextResponse } from "next/server";
import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import { validateAgentKey } from "@/lib/agentAuth";
import path from "path";
import fs from "fs";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");
const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");

export async function POST(req: Request) {
  try {
    if (!validateAgentKey(req)) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    const deviceId = String(body.id || body.deviceId || "");

    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "Cihaz ID gerekli" }, { status: 400 });
    }

    // Bilgileri ve Durumu sil (Detaylı temizlik)
    const infoData = safeReadJson<Record<string, any>>(INFO_FILE, {});
    const statusData = safeReadJson<Record<string, number>>(STATUS_FILE, {});

    // Silinecek cihazın hostname'ini bul
    const targetHostname = (infoData[deviceId]?.hostname || "").toUpperCase();

    // 1. Ana ID'yi sil
    delete infoData[deviceId];
    delete statusData[deviceId];

    // 2. Aynı Hostname'e sahip diğer hayalet kayıtları bul ve sil
    if (targetHostname && targetHostname !== "-") {
      Object.keys(infoData).forEach(id => {
        if ((infoData[id]?.hostname || "").toUpperCase() === targetHostname) {
          console.log(`[Unregister] Hayalet kayıt temizleniyor: ${id}`);
          delete infoData[id];
          delete statusData[id];
        }
      });
    }

    safeWriteJson(INFO_FILE, infoData);
    safeWriteJson(STATUS_FILE, statusData);

    console.log(`[AGENT -] Cihaz ve bağlı tüm kayıtlar silindi: ${deviceId}`);
    return NextResponse.json({ ok: true, message: "Cihaz ve bağlı kayıtlar başarıyla silindi" });
  } catch (error) {
    console.error("[Unregister] Hata:", error);
    return NextResponse.json({ ok: false, error: "İşlem başarısız" }, { status: 500 });
  }
}
