import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

export async function generateCSRFToken(): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return token;
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  
  if (!storedToken || !token) {
    return false;
  }
  
  return storedToken === token;
}

export function getCSRFTokenFromHeaders(headers: Headers): string | null {
  return headers.get(CSRF_TOKEN_HEADER);
}
