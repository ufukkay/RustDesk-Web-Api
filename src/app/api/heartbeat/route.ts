import { NextResponse } from "next/server";
import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import { validateAgentKey } from "@/lib/agentAuth";
import path from "path";

const STATUS_FILE = path.join(process.cwd(), "scripts", "online_status.json");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");
const QUEUE_FILE = path.join(process.cwd(), "scripts", "command_queue.json");

export async function POST(req: Request) {
  try {
    if (!validateAgentKey(req)) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: true });
    }

    const deviceId = (body.id || body.uuid) as string | undefined;
    if (!deviceId) return NextResponse.json({ ok: true });

    const deviceIdStr = String(deviceId);
    const now = Math.floor(Date.now() / 1000);

    let statusData = safeReadJson<Record<string, number>>(STATUS_FILE, {});
    let infoData = safeReadJson<Record<string, Record<string, unknown>>>(INFO_FILE, {});

    // Hostname bazlı deduplication
    if (body.hostname) {
      const isNumericId = /^\d+$/.test(deviceIdStr);

      Object.keys(infoData).forEach((existingId) => {
        if (
          existingId !== deviceIdStr &&
          (infoData[existingId].hostname as string)?.toUpperCase() === (body.hostname as string)?.toUpperCase()
        ) {
          const isExistingNumeric = /^\d+$/.test(existingId);

          if (isNumericId && !isExistingNumeric) {
            infoData[existingId].isDuplicate = true;
            delete statusData[existingId];
          } else if (!isNumericId && isExistingNumeric) {
            if (!infoData[deviceIdStr]) infoData[deviceIdStr] = {};
            infoData[deviceIdStr].isDuplicate = true;
          }
        }
      });

      if (infoData[deviceIdStr] && /^\d+$/.test(deviceIdStr)) {
        infoData[deviceIdStr].isDuplicate = false;
      }
    }

    statusData[deviceIdStr] = now;

    if (!infoData[deviceIdStr]) infoData[deviceIdStr] = {};
    const fields: Array<keyof typeof body> = ["disk", "ip", "user", "gateway", "dns", "network", "hostname", "cpu", "ram", "os"];
    const fieldMap: Record<string, string> = { user: "standard_user" };
    for (const field of fields) {
      if (body[field] !== undefined) {
        infoData[deviceIdStr][fieldMap[field] || field] = body[field];
      }
    }

    safeWriteJson(STATUS_FILE, statusData);
    safeWriteJson(INFO_FILE, infoData);

    // Komut kuyruğu kontrolü
    let pendingCommand = null;
    const hostname = ((body.hostname as string) || (infoData[deviceIdStr]?.hostname as string) || "").toUpperCase();
    const queue = safeReadJson<Record<string, unknown[]>>(QUEUE_FILE, {});

    if (queue[deviceIdStr]?.length > 0) {
      pendingCommand = queue[deviceIdStr].shift();
    } else if (hostname && queue[hostname]?.length > 0) {
      pendingCommand = queue[hostname].shift();
    }

    if (pendingCommand) {
      safeWriteJson(QUEUE_FILE, queue);
    }

    return NextResponse.json({ ok: true, command: pendingCommand });
  } catch (error) {
    console.error("[Heartbeat] Hata:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
