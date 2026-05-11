import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "scripts", "agent", "setup.ps1");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Agent script not found", { status: 404 });
    }

    const scriptContent = fs.readFileSync(filePath, "utf-8");
    
    return new NextResponse(scriptContent, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
