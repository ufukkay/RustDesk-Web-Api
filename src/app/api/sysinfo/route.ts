import { NextResponse } from "next/server";
import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import { validateAgentKey } from "@/lib/agentAuth";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");
const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");

export async function POST(req: Request) {
  try {
    if (!validateAgentKey(req)) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    const deviceId = body.id || body.uuid;
    if (!deviceId) return NextResponse.json({ ok: true });

    const netInfo = body.net_details ?? body.net ?? body.networks ?? body.network_interfaces ?? body.interfaces ?? body.adapters ?? body.info?.net ?? [];

    const infoData = safeReadJson<Record<string, unknown>>(INFO_FILE, {});
    infoData[String(deviceId)] = {
      ...body,
      standard_user: body.user || body.username || body.alias || body.login_name || "-",
      ram: body.memory || body.ram || "-",
      net_details: Array.isArray(netInfo) ? netInfo : [],
      lastUpdate: Math.floor(Date.now() / 1000),
    };
    safeWriteJson(INFO_FILE, infoData);

    const statusData = safeReadJson<Record<string, number>>(STATUS_FILE, {});
    statusData[String(deviceId)] = Math.floor(Date.now() / 1000);
    safeWriteJson(STATUS_FILE, statusData);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Sysinfo] Hata:", error);
    return NextResponse.json({ ok: false, error: "Veri işlenemedi" }, { status: 500 });
  }
}
