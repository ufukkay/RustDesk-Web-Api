import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hostname = searchParams.get("hostname")?.toUpperCase();

    if (!hostname) {
      return NextResponse.json({ error: "hostname required" }, { status: 400 });
    }

    if (!fs.existsSync(INFO_FILE)) {
      return NextResponse.json({ error: "no devices registered yet" }, { status: 404 });
    }

    const infoData = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8"));
    
    // Hostname ile eslesen cihazi bul
    const deviceId = Object.keys(infoData).find(id => {
      const dev = infoData[id];
      return dev.hostname?.toUpperCase() === hostname || dev.name?.toUpperCase() === hostname;
    });

    if (deviceId) {
      return NextResponse.json({ id: deviceId });
    }

    return NextResponse.json({ error: "device not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
