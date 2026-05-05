import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TECH_FILE = path.join(process.cwd(), "scripts", "technicians.json");

export async function GET() {
  try {
    if (!fs.existsSync(TECH_FILE)) {
      return NextResponse.json([]);
    }
    const data = fs.readFileSync(TECH_FILE, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tech = await req.json();
    let technicians = [];
    
    if (fs.existsSync(TECH_FILE)) {
      technicians = JSON.parse(fs.readFileSync(TECH_FILE, "utf-8"));
    }

    // Eğer ID varsa güncelle, yoksa ekle
    const index = technicians.findIndex((t: any) => t.id === tech.id);
    if (index > -1) {
      // Mevcut şifreyi koru (eğer yeni şifre gelmediyse)
      const oldPassword = technicians[index].password;
      technicians[index] = { 
        ...technicians[index], 
        ...tech,
        password: tech.password || oldPassword 
      };
    } else {
      technicians.push(tech);
    }

    fs.writeFileSync(TECH_FILE, JSON.stringify(technicians, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!fs.existsSync(TECH_FILE)) return NextResponse.json({ success: true });

    let technicians = JSON.parse(fs.readFileSync(TECH_FILE, "utf-8"));
    technicians = technicians.filter((t: any) => t.id !== id);
    
    fs.writeFileSync(TECH_FILE, JSON.stringify(technicians, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
