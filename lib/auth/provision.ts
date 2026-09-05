import { Student } from '@/lib/db';
import { ResetToken } from '@/lib/db/reset-token';
import { newResetSecret } from './reset-token';
import { RESET_TTL_MS } from './token';
import { isAllowlistedAdmin } from './allowlist';

/**
 * AN OPERATOR IS PROVISIONED, NEVER REGISTERED (ROUND_6 Task 3). The script
 * makes the account if none exists and issues a set-password link that carries
 * the role; the role is written only when that link is claimed, which is the
 * moment the inbox is proved. An account somebody else registered with the
 * operator's address gets nothing until the operator opens the link.
 */
export async function provisionAdmin(rawEmail: string): Promise<{ secret: string; created: boolean }> {
  const email = rawEmail.trim().toLowerCase();
  if (!isAllowlistedAdmin(email)) throw new Error(`${email} is not in ADMIN_EMAILS`);

  const existing = await Student.findOne({ email }).select('_id').lean();
  if (!existing) {
    await Student.create({
      email,
      name: 'Operator',
      exam_sitting: 'may-june-2027',
      syllabus_mode: 'modular-2027',
      target_modules: [1, 2, 3],
    });
  }
  const { secret, lookup } = newResetSecret();
  await ResetToken.create({ lookup, email, grant_role: 'admin', expires_at: new Date(Date.now() + RESET_TTL_MS) });
  return { secret, created: !existing };
}
