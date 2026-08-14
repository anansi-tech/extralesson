import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSessionToken, getSecret, verifyToken, SESSION_TTL_MS } from './token';

export const SESSION_COOKIE = 'el_session';

export interface SessionUser {
  student_id: string;
  email: string;
}

export async function setSessionCookie(student_id: string, email: string): Promise<void> {
  const token = createSessionToken(student_id, email, getSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const payload = verifyToken(raw, getSecret());
  if (!payload || payload.kind !== 'session') return null;
  return { student_id: payload.student_id, email: payload.email };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect('/study/login');
  return session;
}

export function isAdminEmail(email: string): boolean {
  const allow = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect('/study/login');
  if (!isAdminEmail(session.email)) redirect('/study');
  return session;
}
