import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import { validateAgentKey } from "@/lib/agentAuth";
import path from "path";

const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");
const TECH_FILE = path.join(process.cwd(), "scripts", "technicians.json");

interface Technician {
  id: string;
  name: string;
  email: string;
  username?: string;
  password: string;
  role: string;
}

export async function POST(req: Request) {
  try {
    if (!validateAgentKey(req)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    const { username, password, id, uuid } = body;
    const deviceId = id || uuid;

    // Cihaz kayıt bilgilerini güncelle
    if (deviceId) {
      const infoData = safeReadJson<Record<string, unknown>>(INFO_FILE, {});
      const currentInfo = (infoData[String(deviceId)] as Record<string, unknown>) || {};
      const localIps = body.local_ips || body.info?.local_ips || "";

      infoData[String(deviceId)] = {
        ...currentInfo,
        ...body,
        local_network_raw: localIps,
        lastLoginUpdate: Math.floor(Date.now() / 1000),
      };
      safeWriteJson(INFO_FILE, infoData);
    }

    // RustDesk desktop uygulaması için kullanıcı doğrulaması
    if (username) {
      const technicians = safeReadJson<Technician[]>(TECH_FILE, []);
      const user = technicians.find((t) => t.username === username || t.email === username);

      if (!user) {
        return NextResponse.json({ error: "Invalid username or password" }, { status: 400 });
      }

      const isBcrypt = user.password.startsWith("$2");
      const valid = isBcrypt
        ? await bcrypt.compare(password, user.password)
        : password === user.password;

      if (!valid) {
        return NextResponse.json({ error: "Invalid username or password" }, { status: 400 });
      }

      // On-the-fly migration: düz metin → bcrypt
      if (!isBcrypt) {
        const hashed = await bcrypt.hash(password, 12);
        const updated = technicians.map((t) =>
          t.id === user.id ? { ...t, password: hashed } : t
        );
        safeWriteJson(TECH_FILE, updated);
      }

      return NextResponse.json({
        access_token: `token-${crypto.randomUUID()}`,
        type: "access_token",
        user: { name: user.name, email: user.email },
      });
    }

    return NextResponse.json({ code: 200, message: "OK" });
  } catch (error) {
    console.error("[Login API] Hata:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 400 });
  }
}
