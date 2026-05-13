import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  const protectedPaths = ['/dashboard', '/devices', '/builder', '/settings', '/technicians'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Redirect from login to dashboard if already authenticated
  if (pathname === '/login' && token) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/devices/:path*',
    '/builder/:path*',
    '/settings/:path*',
    '/technicians/:path*',
    '/login'
  ],
};
