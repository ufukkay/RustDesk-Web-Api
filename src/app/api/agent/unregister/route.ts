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

    // Bilgileri sil
    const infoData = safeReadJson<Record<string, unknown>>(INFO_FILE, {});
    if (infoData[deviceId]) {
      delete infoData[deviceId];
      safeWriteJson(INFO_FILE, infoData);
    }

    // Durumu sil
    const statusData = safeReadJson<Record<string, number>>(STATUS_FILE, {});
    if (statusData[deviceId]) {
      delete statusData[deviceId];
      safeWriteJson(STATUS_FILE, statusData);
    }

    console.log(`[AGENT -] Cihaz kaydı silindi: ${deviceId}`);
    return NextResponse.json({ ok: true, message: "Cihaz başarıyla silindi" });
  } catch (error) {
    console.error("[Unregister] Hata:", error);
    return NextResponse.json({ ok: false, error: "İşlem başarısız" }, { status: 500 });
  }
}
