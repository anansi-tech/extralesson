'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { SITTING_IDS } from '@/lib/sittings';
import { dbConnect, Student } from '@/lib/db';
import { ResetToken } from '@/lib/db/reset-token';
import { newResetSecret } from '@/lib/auth/reset-token';
import { RESET_TTL_MS } from '@/lib/auth/token';
import { resetEmail, sendEmail } from '@/lib/email';
import { externalBaseUrl } from '@/lib/base-url';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { grantFromPayment, pendingPaymentFor } from '@/lib/grant-from-payment';
import { limited, TOO_MANY } from '@/lib/auth/rate-limit';

// One deliberate asymmetry runs through this file: SIGNING IN says as little as
// possible, and RESETTING says nothing at all. A form that answers "no account
// with that email" turns the login page into a way to ask whether someone has
// an account here, which is not ours to answer.

const EmailZ = z.string().email().transform((e) => e.toLowerCase().trim());

const SignInZ = z.object({ email: EmailZ, password: z.string().min(1) });

const SIGN_IN_FAILED = 'That email and password do not match.';

const RegisterZ = z.object({
  email: EmailZ,
  password: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  island: z.string().trim().max(60).optional(),
  exam_sitting: z.enum(SITTING_IDS),
  target_modules: z
    .array(z.coerce.number().pipe(z.union([z.literal(1), z.literal(2), z.literal(3)])))
    .optional(),
});

export interface AuthState {
  error?: string;
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
  if (await limited('login', email)) return { error: TOO_MANY, email };

  await dbConnect();
  const student = await Student.findOne({ email }).lean<{
    _id: unknown;
    email: string;
    password_hash?: string;
    session_version?: number;
  } | null>();

  // ONE ANSWER for unknown, legacy and wrong (ROUND_6 Task 3): three answers
  // made the form a way to ask which addresses have an account here.
  const ok = !!student?.password_hash && (await verifyPassword(password, student.password_hash));
  if (!student || !ok) return { error: SIGN_IN_FAILED, email };

  await setSessionCookie(String(student._id), student.email, student.session_version ?? 1);
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
  if (!parsed.success) return { error: 'Check the form — something is missing.' };
  const { email, password, name, island, exam_sitting, target_modules } = parsed.data;

  const problem = passwordProblem(password);
  if (problem) return { error: problem, email };

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

  // PAY FIRST, REGISTER SECOND — the ordering the checkout caption invites. The
  // webhook could only record that payment as unmatched, and waiting for someone
  // to read the admin screen would leave a paying student on the free tier.
  const pending = await pendingPaymentFor(email);
  if (pending) {
    await grantFromPayment({
      studentId: student._id,
      registeredSitting: exam_sitting,
      payment: pending,
    });
  }

  await setSessionCookie(String(student._id), email);
  redirect('/study');
}

export async function requestReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.object({ email: EmailZ }).safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: 'Enter the email you registered with.' };
  const { email } = parsed.data;
  if (await limited('reset-request', email)) return { error: TOO_MANY, email };

  await dbConnect();
  const student = await Student.findOne({ email }).lean();
  if (student) {
    const { secret, lookup } = newResetSecret();
    await ResetToken.create({ lookup, email, expires_at: new Date(Date.now() + RESET_TTL_MS) });
    const link = `${externalBaseUrl()}/study/reset?token=${secret}`;
    try {
      const { skipped, id } = await sendEmail({ to: email, ...resetEmail(link, RESET_TTL_MS / 60000) });
      // The id, not the link. It is what turns "I never got it" into a lookup
      // against the provider's record of whether it was accepted, refused or
      // accepted and filed somewhere the student did not look.
      if (id) console.log(`[reset-link] sent to ${email}, message ${id}`);
      // Without a provider the link must still reach a human, so it goes to the
      // server log. With one it must NOT: a reset link in a log is a way into
      // the account for anyone who can read logs.
      if (skipped) console.log(`[reset-link] ${email} -> ${link}`);
    } catch (err) {
      // A provider that is down must not tell the form anything, or the
      // "we said the same thing either way" property is lost — an error here
      // would mean the address exists.
      console.error('[reset-link] send failed:', err);
    }
  }
  // The same answer either way, whether or not that email has an account.
  return { resetRequested: true, email };
}
