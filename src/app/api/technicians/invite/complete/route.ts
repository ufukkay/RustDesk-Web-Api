import { NextResponse } from "next/server";
import { verifyInvite, removeInvite } from "@/lib/invites";
import fs from "fs";
import path from "path";

const TECH_FILE = path.join(process.cwd(), "scripts", "technicians.json");

export async function POST(req: Request) {
  try {
    const { token, name, username, password } = await req.json();

    if (!token || !name || !username || !password) {
      return NextResponse.json({ error: "Eksik bilgiler" }, { status: 400 });
    }

    const invite = verifyInvite(token);
    if (!invite) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş davet" }, { status: 404 });
    }

    // Load existing technicians
    let technicians = [];
    if (fs.existsSync(TECH_FILE)) {
      technicians = JSON.parse(fs.readFileSync(TECH_FILE, "utf-8"));
    }

    // Check if username or email already exists
    if (technicians.some((t: any) => t.username === username || t.email === invite.email)) {
      return NextResponse.json({ error: "Bu kullanıcı adı veya e-posta zaten kullanımda" }, { status: 400 });
    }

    // Create new technician
    const newTech = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      username,
      email: invite.email,
      password,
      role: invite.role,
      status: "Aktif",
      lastLogin: new Date().toISOString()
    };

    technicians.push(newTech);
    fs.writeFileSync(TECH_FILE, JSON.stringify(technicians, null, 2));

    // Remove the invite
    removeInvite(token);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Invite complete error:", error);
    return NextResponse.json({ error: error.message || "Hesap oluşturulamadı" }, { status: 500 });
  }
}
