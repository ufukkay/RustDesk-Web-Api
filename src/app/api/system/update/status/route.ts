import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const logFile = path.join(process.cwd(), "update.log");
    
    if (!fs.existsSync(logFile)) {
      return NextResponse.json({ status: "idle" });
    }

    const content = fs.readFileSync(logFile, "utf-8");
    
    if (content.includes("DEPLOY_COMPLETE")) {
      return NextResponse.json({ status: "done" });
    }

    if (content.includes("[HATA]")) {
      return NextResponse.json({ status: "error", message: "Build sırasında bir hata oluştu." });
    }

    return NextResponse.json({ status: "running" });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
