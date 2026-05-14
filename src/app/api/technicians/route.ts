import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isAdmin } from "@/lib/auth";
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

export async function GET() {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
    }
    const technicians = safeReadJson<Technician[]>(TECH_FILE, []);
    // Şifreleri response'dan çıkar
    const safe = technicians.map(({ password: _pw, ...rest }) => rest);
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
    }
    const tech: Technician = await req.json();
    const technicians = safeReadJson<Technician[]>(TECH_FILE, []);

    const index = technicians.findIndex((t) => t.id === tech.id);

    if (index > -1) {
      // Güncelleme: yeni şifre geldiyse hash'le, gelmediyse eskiyi koru
      const oldPassword = technicians[index].password;
      let newPassword = oldPassword;

      if (tech.password && tech.password !== oldPassword) {
        const isAlreadyHashed = tech.password.startsWith("$2");
        newPassword = isAlreadyHashed ? tech.password : await bcrypt.hash(tech.password, 12);
      }

      technicians[index] = { ...technicians[index], ...tech, password: newPassword };
    } else {
      // Yeni ekleme: şifre zorunlu
      if (!tech.password) {
        return NextResponse.json({ error: "Şifre gerekli" }, { status: 400 });
      }
      const isAlreadyHashed = tech.password.startsWith("$2");
      const hashedPassword = isAlreadyHashed ? tech.password : await bcrypt.hash(tech.password, 12);
      technicians.push({ ...tech, id: tech.id || crypto.randomUUID(), password: hashedPassword });
    }

    safeWriteJson(TECH_FILE, technicians);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
    }
    const { id } = await req.json();
    const technicians = safeReadJson<Technician[]>(TECH_FILE, []);
    safeWriteJson(TECH_FILE, technicians.filter((t) => t.id !== id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
