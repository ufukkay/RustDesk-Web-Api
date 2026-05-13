import { cookies } from 'next/headers';

export interface AuthUser {
  email: string;
  role: 'Admin' | 'Teknisyen';
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return null;

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check expiration
    if (payload.exp < Date.now()) return null;
    
    return {
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === 'Admin';
}
