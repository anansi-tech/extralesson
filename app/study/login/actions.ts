'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dbConnect, Student } from '@/lib/db';
import { MagicToken } from '@/lib/db/magic-token';
import { createResetToken, getSecret } from '@/lib/auth/token';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';

// Email and password. Round 1 was passwordless, and checking an inbox every
// session was friction a student on a phone would not pay.
//
// One deliberate asymmetry runs through this file: SIGNING IN says as little as
// possible, and RESETTING says nothing at all. A form that answers "no account
// with that email" turns the login page into a way to ask whether someone has
// an account here, which is not ours to answer.

const EmailZ = z.string().email().transform((e) => e.toLowerCase().trim());

const SignInZ = z.object({ email: EmailZ, password: z.string().min(1) });

const RegisterZ = z.object({
  email: EmailZ,
  password: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  island: z.string().trim().max(60).optional(),
  exam_sitting: z.enum(['jan-2027', 'may-june-2027']),
  target_modules: z
    .array(z.coerce.number().pipe(z.union([z.literal(1), z.literal(2), z.literal(3)])))
    .optional(),
});

export interface AuthState {
  error?: string;
  /** The email is not registered, so the form offers to create the account. */
  needsProfile?: boolean;
  /** A reset link was requested; the message never says whether it was sent. */
  resetRequested?: boolean;
  /** Carried back so the form does not make them retype it. */
  email?: string;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = SignInZ.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'Enter your email and your password.' };
  const { email, password } = parsed.data;

  await dbConnect();
  const student = await Student.findOne({ email }).lean<{
    _id: unknown;
    email: string;
    password_hash?: string;
  } | null>();

  if (!student) return { needsProfile: true, email };
  if (!student.password_hash) {
    // An account from before passwords existed. Say so plainly — this one is
    // not a disclosure, because they have already proved the email exists by
    // having signed in with it before.
    return {
      error: 'This account was made before passwords. Use "Forgot your password?" to set one.',
      email,
    };
  }
  if (!(await verifyPassword(password, student.password_hash))) {
    return { error: 'That email and password do not match.', email };
  }

  await setSessionCookie(String(student._id), student.email);
  redirect('/study');
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = RegisterZ.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
    island: formData.get('island') || undefined,
    exam_sitting: formData.get('exam_sitting'),
    target_modules: formData.getAll('target_modules').length ? formData.getAll('target_modules') : undefined,
  });
  if (!parsed.success) return { error: 'Check the form — something is missing.', needsProfile: true };
  const { email, password, name, island, exam_sitting, target_modules } = parsed.data;

  const problem = passwordProblem(password);
  if (problem) return { error: problem, needsProfile: true, email };

  await dbConnect();
  if (await Student.findOne({ email }).lean()) {
    return { error: 'There is already an account with that email — sign in instead.', email };
  }

  // Jan re-sit students sit the full paper — all modules. Modular students may
  // target a subset (ROUND_1 §3.4).
  const targets = exam_sitting === 'jan-2027' ? [1, 2, 3] : target_modules?.length ? target_modules : [1, 2, 3];
  const student = await Student.create({
    email,
    name,
    island,
    exam_sitting,
    syllabus_mode: exam_sitting === 'jan-2027' ? 'legacy-jan' : 'modular-2027',
    target_modules: targets,
    password_hash: await hashPassword(password),
  });

  await setSessionCookie(String(student._id), email);
  redirect('/study');
}

export async function requestReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.object({ email: EmailZ }).safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: 'Enter the email you registered with.' };
  const { email } = parsed.data;

  await dbConnect();
  const student = await Student.findOne({ email }).lean();
  if (student) {
    const { token, jti, expires_at } = createResetToken(email, getSecret());
    await MagicToken.create({ jti, email, expires_at });
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    // No email provider is configured (see README) — the link is delivered via
    // the server log, exactly as the sign-in link was.
    console.log(`[reset-link] ${email} -> ${base}/study/reset?token=${encodeURIComponent(token)}`);
  }
  // The same answer either way, whether or not that email has an account.
  return { resetRequested: true, email };
}
