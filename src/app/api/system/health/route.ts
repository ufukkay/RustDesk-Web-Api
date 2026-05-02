import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
  try {
    let hbbsStatus = "Durmuş";
    let hbbrStatus = "Durmuş";

    try {
      const ps = execSync("ps aux | grep hbb").toString();
      if (ps.includes("hbbs")) hbbsStatus = "Çalışıyor";
      if (ps.includes("hbbr")) hbbrStatus = "Çalışıyor";
    } catch (e) {}

    return NextResponse.json({
      hbbs: hbbsStatus,
      hbbr: hbbrStatus,
      timestamp: new Date().toLocaleTimeString()
    });
  } catch (error) {
    return NextResponse.json({ hbbs: "Hata", hbbr: "Hata" });
  }
}
