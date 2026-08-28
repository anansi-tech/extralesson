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
 * How long before a second diagnostic opens.
 *
 * The diagnostic is free, and free plus UNLIMITED made it unlimited free MCQ
 * practice: a second door onto the bank for anyone willing to keep starting
 * one. It is one per student now. The interval is for the student who comes
 * back after a term away and whose ranking is genuinely stale — not a second
 * go at eight questions this week. Long on purpose: a re-take that felt
 * routine would be the same hole with a delay in front of it.
 */
export const DIAGNOSTIC_INTERVAL_DAYS = 90;

/**
 * When this student's next diagnostic opens, or null if they have never sat
 * one. Read from started_at, which every session carries and is indexed by.
 */
export async function diagnosticOpensAt(studentId: string): Promise<Date | null> {
  const last = await PracticeSession.findOne({ student_id: studentId, mode: 'diagnostic' })
    .sort({ started_at: -1 })
    .select('started_at')
    .lean<{ started_at: Date } | null>();
  if (!last?.started_at) return null;
  return new Date(last.started_at.getTime() + DIAGNOSTIC_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Sessions that count against the free tier: the ones the student chose to sit.
 * A diagnostic is free and stays free — it is how a new student finds out where
 * they are, and charging for that means charging before we have shown anything.
 * It is capped rather than priced; see DIAGNOSTIC_INTERVAL_DAYS.
 */
export async function freeSessionsUsed(studentId: string): Promise<number> {
  return PracticeSession.countDocuments({
    student_id: studentId,
    mode: { $ne: 'diagnostic' },
  });
}

/**
 * The refusal carries the reason, and the reason IS the error code the hub
 * reads. It was a boolean before, which could only ever say two things.
 */
export type SessionGate =
  | { allowed: true }
  | { allowed: false; reason: 'needs-access' | 'access-expired'; used: number }
  | { allowed: false; reason: 'diagnostic-taken'; opensAt: Date };

export async function canStartSession(
  studentId: string,
  access: Access | null | undefined,
  mode: string,
  now: Date = new Date(),
): Promise<SessionGate> {
  // The diagnostic is not behind the paywall and never has been; it is behind
  // its own cap, which applies to a paying student too. Someone who has paid
  // has whole sessions to sit and does not need the diagnostic as a source of
  // questions either.
  if (mode === 'diagnostic') {
    const opensAt = await diagnosticOpensAt(studentId);
    if (opensAt === null || now.getTime() >= opensAt.getTime()) return { allowed: true };
    return { allowed: false, reason: 'diagnostic-taken', opensAt };
  }
  if (hasAccess(access, now)) return { allowed: true };
  // An expired account falls back to the free tier EXACTLY as an unpaid one
  // does — the counter is over every session ever started, so a student who
  // studied through a sitting is already past it. The reason only changes which
  // sentence they read.
  const expired = Boolean(access?.sitting);
  const used = await freeSessionsUsed(studentId);
  return used < FREE_SESSIONS
    ? { allowed: true }
    : { allowed: false, reason: expired ? 'access-expired' : 'needs-access', used };
}
