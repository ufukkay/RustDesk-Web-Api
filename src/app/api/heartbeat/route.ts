import { NextResponse } from "next/server";

// RustDesk istemcilerinin gönderdiği heartbeat sinyallerini susturmak için
export async function POST() {
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
