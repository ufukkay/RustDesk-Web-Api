import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    total: 1,
    groups: [
      { id: "genel", name: "Genel Cihazlar" }
    ]
  });
}
