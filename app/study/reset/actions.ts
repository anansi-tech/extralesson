'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dbConnect, Student } from '@/lib/db';
import { getSecret, verifyToken } from '@/lib/auth/token';
import { claimMagicToken } from '@/lib/auth/consume';
import { hashPassword, passwordProblem } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';

export interface ResetState {
  error?: string;
}

// Setting a new password from a reset link. The link proves control of the
// inbox, the jti makes it single-use, and using it signs them in — a student
// who has just proved who they are should not be asked to prove it again.
export async function setPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = z
    .object({ token: z.string().min(1), password: z.string().min(1) })
    .safeParse({ token: formData.get('token'), password: formData.get('password') });
  if (!parsed.success) return { error: 'Something is missing from the form.' };

  const problem = passwordProblem(parsed.data.password);
  if (problem) return { error: problem };

  const payload = verifyToken(parsed.data.token, getSecret());
  if (!payload || payload.kind !== 'reset') {
    return { error: 'That link has expired. Ask for a new one.' };
  }

  await dbConnect();
  // Single-use: claim the jti before anything is changed, so a link that is
  // opened twice cannot set two passwords.
  const claimed = await claimMagicToken(payload.jti);
  if (!claimed) return { error: 'That link has already been used. Ask for a new one.' };

  const student = await Student.findOne({ email: payload.email });
  if (!student) return { error: 'That link has expired. Ask for a new one.' };

  student.password_hash = await hashPassword(parsed.data.password);
  await student.save();

  await setSessionCookie(String(student._id), student.email);
  redirect('/study');
}
