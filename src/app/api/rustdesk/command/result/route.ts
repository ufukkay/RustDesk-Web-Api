import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { safeReadJson } from "@/lib/fileUtils";
import { validateAgentKey } from "@/lib/agentAuth";
import fs from "fs";
import path from "path";

const RESULTS_DIR = path.join(process.cwd(), "scripts", "command_results");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function resolveKey(deviceId: string): string {
  const info = safeReadJson<Record<string, Record<string, string>>>(INFO_FILE, {});
  return info[deviceId]?.hostname?.toUpperCase() || String(deviceId);
}

/** Agent'tan gelen komut sonucunu kaydeder */
export async function POST(req: Request) {
  try {
    if (!validateAgentKey(req)) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    const deviceId = body.deviceId || body.id;
    const output = body.output || body.result;

    if (!deviceId) return NextResponse.json({ ok: false });

    const key = safeFileName(resolveKey(String(deviceId)));

    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }

    fs.writeFileSync(path.join(RESULTS_DIR, `${key}.txt`), output || "Boş çıktı", "utf-8");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[CommandResult POST] Hata:", error);
    return NextResponse.json({ ok: false });
  }
}

/** Dashboard'dan komut sonucunu okur */
export async function GET(req: Request) {
  try {
    if (!await getAuthUser()) {
      return NextResponse.json({ output: null }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");
    if (!deviceId) return NextResponse.json({ output: null });

    const key = safeFileName(resolveKey(deviceId));
    const resultFile = path.join(RESULTS_DIR, `${key}.txt`);

    if (fs.existsSync(resultFile)) {
      const output = fs.readFileSync(resultFile, "utf-8");
      fs.unlinkSync(resultFile);

      try {
        return NextResponse.json({ output: Buffer.from(output, "base64").toString("utf-8") });
      } catch {
        return NextResponse.json({ output });
      }
    }

    return NextResponse.json({ output: null });
  } catch {
    return NextResponse.json({ output: null });
  }
}
