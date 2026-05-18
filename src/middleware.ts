import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "CHANGE_ME_SET_JWT_SECRET_IN_ENV_LOCAL";
  return new TextEncoder().encode(secret);
}

async function isValidToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  const protectedPaths = ["/dashboard", "/devices", "/builder", "/settings", "/technicians", "/wiki"];
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isProtected) {
    if (!token || !(await isValidToken(token))) {
      const url = new URL("/login", request.url);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/login" && token && (await isValidToken(token))) {
    const url = new URL("/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/devices",
    "/devices/:path*",
    "/builder",
    "/builder/:path*",
    "/settings",
    "/settings/:path*",
    "/technicians",
    "/technicians/:path*",
    "/wiki",
    "/wiki/:path*",
    "/login",
  ],
};
