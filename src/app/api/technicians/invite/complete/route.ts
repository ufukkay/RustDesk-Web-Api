import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyInvite, removeInvite } from "@/lib/invites";
import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import path from "path";

const TECH_FILE = path.join(process.cwd(), "scripts", "technicians.json");

interface Technician {
  id: string;
  name: string;
  username?: string;
  email: string;
  password: string;
  role: "Admin" | "Teknisyen";
  status: string;
  lastLogin: string;
}

export async function POST(req: Request) {
  try {
    const { token, name, username, password } = await req.json();

    if (!token || !name || !username || !password) {
      return NextResponse.json({ error: "Eksik bilgiler" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır" }, { status: 400 });
    }

    const invite = verifyInvite(token);
    if (!invite) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş davet" }, { status: 404 });
    }

    const technicians = safeReadJson<Technician[]>(TECH_FILE, []);

    if (technicians.some((t) => t.username === username || t.email === invite.email)) {
      return NextResponse.json({ error: "Bu kullanıcı adı veya e-posta zaten kullanımda" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newTech: Technician = {
      id: crypto.randomUUID(),
      name,
      username,
      email: invite.email,
      password: hashedPassword,
      role: invite.role,
      status: "Aktif",
      lastLogin: new Date().toISOString(),
    };

    safeWriteJson(TECH_FILE, [...technicians, newTech]);
    removeInvite(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[InviteComplete] Hata:", error);
    return NextResponse.json({ error: "Hesap oluşturulamadı" }, { status: 500 });
  }
}
