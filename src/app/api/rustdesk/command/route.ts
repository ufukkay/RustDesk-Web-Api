import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import path from "path";

const QUEUE_FILE = path.join(process.cwd(), "scripts", "command_queue.json");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function POST(req: Request) {
  try {
    if (!await getAuthUser()) {
      return NextResponse.json({ success: false, message: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    const { deviceId, action, command } = body;

    if (!deviceId) {
      return NextResponse.json({ success: false, message: "ID Required" });
    }

    let finalCommand = "";
    if (action === "restart") finalCommand = "shutdown /r /t 5 /f";
    else if (action === "shutdown") finalCommand = "shutdown /s /t 5 /f";
    else if (action === "lock") finalCommand = "lock";
    else if (action === "refresh") finalCommand = "refresh_info";
    else if (action === "terminal") finalCommand = command || "";

    if (!finalCommand) {
      return NextResponse.json({ success: false, message: "No Command" });
    }

    const info = safeReadJson<Record<string, Record<string, string>>>(INFO_FILE, {});
    const hostname = info[deviceId]?.hostname?.toUpperCase() || String(deviceId);

    const queue = safeReadJson<Record<string, string[]>>(QUEUE_FILE, {});
    if (!queue[hostname]) queue[hostname] = [];
    queue[hostname].push(finalCommand);

    safeWriteJson(QUEUE_FILE, queue);

    return NextResponse.json({ success: true, message: "Queued" });
  } catch {
    return NextResponse.json({ success: false, message: "Error" });
  }
}
