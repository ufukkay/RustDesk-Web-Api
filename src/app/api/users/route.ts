import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const TECH_FILE = path.join(process.cwd(), "scripts", "technicians.json");
    let technicians = [];
    
    if (fs.existsSync(TECH_FILE)) {
      try { technicians = JSON.parse(fs.readFileSync(TECH_FILE, "utf-8")); } catch (e) {}
    }

    const data = technicians.map((t: any) => ({
      name: t.username || t.name,
      email: t.email,
      role: t.role,
      status: 1
    }));

    return NextResponse.json({
      total: data.length,
      data: data
    });
  } catch (error) {
    return NextResponse.json({ total: 0, data: [] });
  }
}
