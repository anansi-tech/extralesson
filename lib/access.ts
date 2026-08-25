import { PracticeSession } from '@/lib/db';
import { accessEndsAt } from '@/lib/sittings';

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

/**
 * The refund window, in days. Commercial policy rather than a mechanism — there
 * is no code that enforces it — but it is STATED in two places, the offer and
 * the terms, and those two said different things: "full refund at launch"
 * against "within 14 days of paying". A number a page repeats is a number that
 * drifts, so both read it from here.
 */
export const REFUND_DAYS = 14;

export interface Access {
  sitting: string;
  granted_at: Date;
  source: string;
  note?: string;
}

/**
 * Access runs until the sitting it was bought for, plus a grace period.
 *
 * An expired account is treated exactly as one that never paid: the paywall
 * comes back on NEW sessions, and nothing already earned is touched. Somebody
 * who sat CSEC in June and comes back in October is a new customer for the next
 * sitting, not a locked-out one — their notebook is all still there.
 *
 * A sitting with no end date recorded does not expire. That can only happen if
 * a sitting is added to the enum without a date in lib/sittings.ts, and of the
 * two ways to be wrong, "a paying student keeps access slightly too long" beats
 * "a paying student is locked out by an oversight".
 */
export function hasAccess(access: Access | null | undefined, now: Date = new Date()): boolean {
  if (!access?.sitting) return false;
  const endsAt = accessEndsAt(access.sitting);
  return endsAt === null || now.getTime() <= endsAt.getTime();
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
  now: Date = new Date(),
): Promise<{ allowed: true } | { allowed: false; used: number; expired: boolean }> {
  if (hasAccess(access, now) || mode === 'diagnostic') return { allowed: true };
  // An expired account falls back to the free tier EXACTLY as an unpaid one
  // does — the counter is over every session ever started, so a student who
  // studied through a sitting is already past it. The flag only changes which
  // sentence they read.
  const expired = Boolean(access?.sitting);
  const used = await freeSessionsUsed(studentId);
  return used < FREE_SESSIONS ? { allowed: true } : { allowed: false, used, expired };
}
