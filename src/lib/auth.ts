import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export interface AuthUser {
  email: string;
  role: "Admin" | "Teknisyen";
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn("[AUTH] JWT_SECRET env değişkeni ayarlanmamış — .env.local dosyasına JWT_SECRET ekleyin");
  }
  return new TextEncoder().encode(secret || "CHANGE_ME_SET_JWT_SECRET_IN_ENV_LOCAL");
}

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(getJwtSecret());
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      typeof payload.email !== "string" ||
      (payload.role !== "Admin" && payload.role !== "Teknisyen")
    ) {
      return null;
    }
    return { email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === "Admin";
}
