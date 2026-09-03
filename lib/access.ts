import { PracticeSession } from '@/lib/db';
import { accessEndsAt } from '@/lib/sittings';

/**
 * The free tier: the diagnostic plus two full sessions. The check is on
 * CREATING a session and nowhere else — everything already earned stays
 * visible, because an attempt is a record of work done.
 */
export const FREE_SESSIONS: number = 2;

/**
 * The refund window, in days. Commercial policy, not a mechanism — nothing
 * enforces it — but the offer and the terms both state it, and a number a page
 * repeats is a number that drifts, so both read it from here.
 */
export const REFUND_DAYS = 14;

export interface Access {
  sitting: string;
  granted_at: Date;
  source: string;
  note?: string;
}

/**
 * Access runs to the sitting it was bought for, plus grace. An expired account
 * is treated as one that never paid: the paywall returns on NEW sessions,
 * nothing earned is touched, and a sitting with no end date never expires.
 */
export function hasAccess(access: Access | null | undefined, now: Date = new Date()): boolean {
  if (!access?.sitting) return false;
  const endsAt = accessEndsAt(access.sitting);
  return endsAt === null || now.getTime() <= endsAt.getTime();
}

/**
 * How long before a second diagnostic opens. Free plus unlimited would make it
 * unlimited free MCQ practice, so it is one per student, and the interval is
 * long on purpose: it is for someone returning after a term away.
 */
export const DIAGNOSTIC_INTERVAL_DAYS = 90;

/** When this student's next diagnostic opens, or null if they never sat one. */
export async function diagnosticOpensAt(studentId: string): Promise<Date | null> {
  const last = await PracticeSession.findOne({ student_id: studentId, mode: 'diagnostic' })
    .sort({ started_at: -1 })
    .select('started_at')
    .lean<{ started_at: Date } | null>();
  if (!last?.started_at) return null;
  return new Date(last.started_at.getTime() + DIAGNOSTIC_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Sessions that count against the free tier: the ones the student chose to
 * sit. A diagnostic stays free — charging for it means charging before we have
 * shown anything — and is capped instead; see DIAGNOSTIC_INTERVAL_DAYS.
 */
export async function freeSessionsUsed(studentId: string): Promise<number> {
  return PracticeSession.countDocuments({
    student_id: studentId,
    mode: { $ne: 'diagnostic' },
  });
}

/** The refusal's reason IS the error code the hub reads. */
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
  // Not a paywall but a cap, so it applies to a paying student too: they have
  // whole sessions to sit and do not need the diagnostic for questions.
  if (mode === 'diagnostic') {
    const opensAt = await diagnosticOpensAt(studentId);
    if (opensAt === null || now.getTime() >= opensAt.getTime()) return { allowed: true };
    return { allowed: false, reason: 'diagnostic-taken', opensAt };
  }
  if (hasAccess(access, now)) return { allowed: true };
  // An expired account falls back to the free tier EXACTLY as an unpaid one
  // does; the counter is over every session ever started, so the reason only
  // changes which sentence they read.
  const expired = Boolean(access?.sitting);
  const used = await freeSessionsUsed(studentId);
  return used < FREE_SESSIONS
    ? { allowed: true }
    : { allowed: false, reason: expired ? 'access-expired' : 'needs-access', used };
}
