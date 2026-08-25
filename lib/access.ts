import { PracticeSession } from '@/lib/db';

/**
 * WHAT THE FREE TIER IS, IN ONE PLACE.
 *
 * The diagnostic, which is not scored and only ranks their topics, plus two
 * full sessions. After that a new session needs paid access; everything already
 * earned stays visible, because an attempt is a record of work done and paying
 * is not what made it true.
 *
 * The check is on CREATING a session and nowhere else. A paywall that also hid
 * the notebook would be taking back what a student has already done.
 */
export const FREE_SESSIONS: number = 2;

export interface Access {
  sitting: string;
  granted_at: Date;
  source: string;
  note?: string;
}

export function hasAccess(access: Access | null | undefined): boolean {
  return Boolean(access?.sitting);
}

/**
 * Sessions that count against the free tier: the ones the student chose to sit.
 * A diagnostic is free and stays free — it is how a new student finds out where
 * they are, and charging for that means charging before we have shown anything.
 */
export async function freeSessionsUsed(studentId: string): Promise<number> {
  return PracticeSession.countDocuments({
    student_id: studentId,
    mode: { $ne: 'diagnostic' },
  });
}

export async function canStartSession(
  studentId: string,
  access: Access | null | undefined,
  mode: string,
): Promise<{ allowed: true } | { allowed: false; used: number }> {
  if (hasAccess(access) || mode === 'diagnostic') return { allowed: true };
  const used = await freeSessionsUsed(studentId);
  return used < FREE_SESSIONS ? { allowed: true } : { allowed: false, used };
}
