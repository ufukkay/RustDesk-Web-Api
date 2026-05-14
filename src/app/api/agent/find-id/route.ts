import { NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agentAuth";
import { safeReadJson } from "@/lib/fileUtils";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function GET(req: Request) {
  try {
    if (!validateAgentKey(req)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const hostname = searchParams.get("hostname")?.toUpperCase();

    if (!hostname) {
      return NextResponse.json({ error: "hostname required" }, { status: 400 });
    }

    const infoData = safeReadJson<Record<string, Record<string, string>>>(INFO_FILE, {});

    const deviceId = Object.keys(infoData).find((id) => {
      const dev = infoData[id];
      return dev.hostname?.toUpperCase() === hostname || dev.name?.toUpperCase() === hostname;
    });

    if (deviceId) {
      return NextResponse.json({ id: deviceId });
    }

    return NextResponse.json({ error: "device not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
