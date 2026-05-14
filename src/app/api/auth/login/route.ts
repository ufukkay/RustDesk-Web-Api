import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import path from "path";

const TECH_FILE = path.join(process.cwd(), "scripts", "technicians.json");

interface Technician {
  id: string;
  name: string;
  email: string;
  username?: string;
  password: string;
  role: "Admin" | "Teknisyen";
  status?: string;
  lastLogin?: string;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "E-posta ve şifre gerekli." }, { status: 400 });
    }

    const technicians = safeReadJson<Technician[]>(TECH_FILE, []);

    if (technicians.length === 0) {
      return NextResponse.json(
        { success: false, message: "Henüz hiç kullanıcı tanımlı değil. Lütfen önce bir Admin hesabı oluşturun." },
        { status: 401 }
      );
    }

    const user = technicians.find((t) => t.email === email);
    if (!user) {
      return NextResponse.json({ success: false, message: "E-posta veya şifre hatalı." }, { status: 401 });
    }

    // bcrypt hash mi yoksa eski düz metin mi? — geçiş dönemi için ikisini destekle
    const isBcrypt = user.password.startsWith("$2");
    const passwordValid = isBcrypt
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!passwordValid) {
      return NextResponse.json({ success: false, message: "E-posta veya şifre hatalı." }, { status: 401 });
    }

    // Düz metin şifreyi hash'e yükselt (on-the-fly migration)
    if (!isBcrypt) {
      const hashed = await bcrypt.hash(password, 12);
      const updated = technicians.map((t) =>
        t.id === user.id ? { ...t, password: hashed, lastLogin: new Date().toISOString() } : t
      );
      safeWriteJson(TECH_FILE, updated);
    } else {
      const updated = technicians.map((t) =>
        t.id === user.id ? { ...t, lastLogin: new Date().toISOString() } : t
      );
      safeWriteJson(TECH_FILE, updated);
    }

    const token = await signToken({ email: user.email, role: user.role });

    const { password: _pw, ...userWithoutPassword } = user;
    const response = NextResponse.json({ success: true, user: userWithoutPassword });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("[Login] Hata:", error);
    return NextResponse.json({ success: false, message: "Sunucu hatası." }, { status: 500 });
  }
}
