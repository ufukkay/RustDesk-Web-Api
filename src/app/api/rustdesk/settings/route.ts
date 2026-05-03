import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (saveSettings(data)) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
