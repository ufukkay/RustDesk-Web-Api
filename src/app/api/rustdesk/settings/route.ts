import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  return NextResponse.json(getSettings());
}

export async function POST(req: Request) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
    const data = await req.json();
    if (saveSettings(data)) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
