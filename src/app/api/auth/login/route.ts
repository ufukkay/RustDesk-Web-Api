import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TECH_FILE = path.join(process.cwd(), "scripts", "technicians.json");

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!fs.existsSync(TECH_FILE)) {
      // Eğer hiç teknisyen yoksa, varsayılan admin girişine izin verelim (ilk kurulum için)
      if (email === "admin@rustdesk.local" && password === "admin123") {
        return NextResponse.json({
          success: true,
          user: { name: "Admin", email: "admin@rustdesk.local", role: "Admin" }
        });
      }
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı." }, { status: 401 });
    }

    const technicians = JSON.parse(fs.readFileSync(TECH_FILE, "utf-8"));
    const user = technicians.find((t: any) => t.email === email && t.password === password);

    if (user) {
      // Şifreyi response'dan çıkaralım
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json({
        success: true,
        user: userWithoutPassword
      });
    }

    return NextResponse.json({ success: false, message: "E-posta veya şifre hatalı." }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Sunucu hatası." }, { status: 500 });
  }
}
