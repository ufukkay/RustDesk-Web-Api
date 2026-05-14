import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import path from "path";

const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function POST() {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const statusData = safeReadJson<Record<string, number>>(STATUS_FILE, {});
    const infoData = safeReadJson<Record<string, unknown>>(INFO_FILE, {});

    const now = Math.floor(Date.now() / 1000);
    const newStatus: Record<string, number> = {};
    const newInfo: Record<string, unknown> = {};
    let count = 0;

    for (const id of Object.keys(statusData)) {
      if (now - statusData[id] < 60) {
        newStatus[id] = statusData[id];
        if (infoData[id]) newInfo[id] = infoData[id];
      } else {
        count++;
      }
    }

    safeWriteJson(STATUS_FILE, newStatus);
    safeWriteJson(INFO_FILE, newInfo);

    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}
