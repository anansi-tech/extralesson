'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dbConnect, Student } from '@/lib/db';
import { claimResetSecret } from '@/lib/auth/consume';
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

  await dbConnect();
  // Single-use and in-date, claimed atomically before anything is changed, so a
  // link opened twice cannot set two passwords. Unknown, used and expired are
  // deliberately the same answer: telling them apart tells the holder of a
  // stale link which kind of stale it is, and they can do nothing with either.
  const claimed = await claimResetSecret(parsed.data.token);
  if (!claimed) return { error: 'That link has expired or has already been used. Ask for a new one.' };

  const student = await Student.findOne({ email: claimed.email });
  if (!student) return { error: 'That link has expired. Ask for a new one.' };

  student.password_hash = await hashPassword(parsed.data.password);
  // A provisioning link grants its role here, once the inbox is proved.
  if (claimed.grant_role) student.role = claimed.grant_role;
  await student.save();

  await setSessionCookie(String(student._id), student.email);
  redirect('/study');
}
