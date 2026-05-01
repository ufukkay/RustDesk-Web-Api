import { NextResponse } from "next/server";

// RustDesk istemcilerinin gönderdiği sistem bilgilerini susturmak için
export async function POST() {
  return NextResponse.json({ ok: true });
}
