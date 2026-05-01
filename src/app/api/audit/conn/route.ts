import { NextResponse } from "next/server";

// RustDesk bağlantı raporlarını susturmak için
export async function POST() {
  return NextResponse.json({ ok: true });
}
