import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Student } from '@/lib/db';
import { getSecret, verifyToken } from '@/lib/auth/token';
import { claimMagicToken } from '@/lib/auth/consume';
import { setSessionCookie } from '@/lib/auth/session';

// GET /study/verify?token=... — consume a magic link, establish a session.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const fail = () =>
    NextResponse.redirect(new URL('/study/login?error=expired', req.nextUrl.origin));
  if (!token) return fail();

  const payload = verifyToken(token, getSecret());
  if (!payload || payload.kind !== 'magic') return fail();

  await dbConnect();
  // Single-use: atomically claim the jti. A second visit finds used_at set.
  const doc = await claimMagicToken(payload.jti);
  if (!doc) return fail();

  let student = await Student.findOne({ email: payload.email });
  if (!student) {
    const profile = doc.profile;
    if (!profile) return fail(); // token minted for an account that no longer exists
    student = await Student.create({
      email: payload.email,
      name: profile.name,
      island: profile.island,
      exam_sitting: profile.exam_sitting,
      // syllabus_mode is derived from the sitting; display only (ROUND_1 §0).
      syllabus_mode: profile.exam_sitting === 'jan-2027' ? 'legacy-jan' : 'modular-2027',
      target_modules: profile.target_modules,
    });
  }

  await setSessionCookie(String(student._id), payload.email);
  return NextResponse.redirect(new URL('/study', req.nextUrl.origin));
}
