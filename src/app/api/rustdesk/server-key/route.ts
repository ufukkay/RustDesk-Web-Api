import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  try {
    const keyPaths = [
      "/var/lib/rustdesk-server/id_ed25519.pub",
      "/root/rustdesk/id_ed25519.pub",
      "./id_ed25519.pub"
    ];

    let key = "Anahtar bulunamadı";
    for (const path of keyPaths) {
      if (fs.existsSync(path)) {
        key = fs.readFileSync(path, "utf-8").trim();
        break;
      }
    }

    return NextResponse.json({ key });
  } catch (error) {
    return NextResponse.json({ key: "Hata oluştu" });
  }
}
