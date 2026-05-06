import { NextResponse } from "next/server";
import { verifyInvite } from "@/lib/invites";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token eksik" }, { status: 400 });
  }

  const invite = verifyInvite(token);
  if (!invite) {
    return NextResponse.json({ error: "Geçersiz veya süresi dolmuş davet" }, { status: 404 });
  }

  return NextResponse.json({ 
    email: invite.email,
    role: invite.role 
  });
}
