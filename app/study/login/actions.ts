'use server';

import { z } from 'zod';
import { dbConnect, Student } from '@/lib/db';
import { MagicToken } from '@/lib/db/magic-token';
import { createMagicLinkToken, getSecret } from '@/lib/auth/token';

const RequestLinkZ = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  // Registration fields — used only if no student exists for this email yet.
  name: z.string().trim().max(120).optional(),
  island: z.string().trim().max(60).optional(),
  exam_sitting: z.enum(['jan-2027', 'may-june-2027']).optional(),
  target_modules: z.array(z.coerce.number().pipe(z.union([z.literal(1), z.literal(2), z.literal(3)]))).optional(),
});

export interface RequestLinkState {
  ok?: boolean;
  error?: string;
  needsProfile?: boolean;
}

export async function requestMagicLink(
  _prev: RequestLinkState,
  formData: FormData,
): Promise<RequestLinkState> {
  const parsed = RequestLinkZ.safeParse({
    email: formData.get('email'),
    name: formData.get('name') || undefined,
    island: formData.get('island') || undefined,
    exam_sitting: formData.get('exam_sitting') || undefined,
    target_modules: formData.getAll('target_modules').length
      ? formData.getAll('target_modules')
      : undefined,
  });
  if (!parsed.success) return { error: 'Check the form — the email or module choices are invalid.' };
  const { email, name, island, exam_sitting, target_modules } = parsed.data;

  await dbConnect();
  const existing = await Student.findOne({ email }).lean();

  let profile;
  if (!existing) {
    // New student: need registration fields before we can mint an account.
    if (!name || !exam_sitting) return { needsProfile: true };
    // Jan re-sit students sit the full paper — all modules. Modular students
    // may target a subset (ROUND_1 §3.4).
    const targets =
      exam_sitting === 'jan-2027' ? [1, 2, 3] : (target_modules?.length ? target_modules : [1, 2, 3]);
    profile = { name, island, exam_sitting, target_modules: targets };
  }

  const { token, jti, expires_at } = createMagicLinkToken(email, getSecret());
  await MagicToken.create({ jti, email, profile, expires_at });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const link = `${base}/study/verify?token=${encodeURIComponent(token)}`;
  // No email provider is configured this round (see README). The link is
  // delivered via server log.
  console.log(`[magic-link] ${email} -> ${link}`);

  return { ok: true };
}
