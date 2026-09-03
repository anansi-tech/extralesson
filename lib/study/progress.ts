import { Attempt, PracticeSession } from '@/lib/db';

// What a student has actually done, counted from the append-only record. The
// predicted grade does not move on most days early on, so a page showing only
// the estimate has nothing to show for the session just finished.

export interface Progress {
  sessionsCompleted: number;
  questionsAnswered: number;
  marksAttempted: number;
  /** Consecutive days, ending today or yesterday, with a completed session. */
  streakDays: number;
  firstSessionAt: Date | null;
}

/** Local-day key, so a session at 11pm and one at 1am are different days. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function daysBack(from: Date, n: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

/**
 * A streak counts back from today, and TODAY DOES NOT BREAK IT: counting from
 * today alone would report a broken streak every morning to someone who has not
 * broken anything, so a streak that reaches yesterday is still alive.
 */
export function streakFrom(days: Set<string>, now: Date): number {
  let start = 0;
  if (!days.has(dayKey(now))) {
    if (!days.has(daysBack(now, 1))) return 0;
    start = 1;
  }
  let n = 0;
  while (days.has(daysBack(now, start + n))) n++;
  return n;
}

export async function loadProgress(studentId: string, now: Date = new Date()): Promise<Progress> {
  const [sessions, attempts] = await Promise.all([
    PracticeSession.find({ student_id: studentId, completed_at: { $ne: null } })
      .select('completed_at started_at')
      .lean<{ completed_at: Date; started_at: Date }[]>(),
    Attempt.find({ student_id: studentId })
      .populate('question_id', 'marks')
      .select('question_id ts')
      .lean<{ question_id?: { marks: number }; ts: Date }[]>(),
  ]);

  const days = new Set(sessions.map((s) => dayKey(new Date(s.completed_at))));
  const starts = sessions.map((s) => new Date(s.started_at).getTime());

  return {
    sessionsCompleted: sessions.length,
    questionsAnswered: attempts.length,
    // The marks in front of them, which is the unit the session is budgeted in.
    marksAttempted: attempts.reduce((sum, a) => sum + (a.question_id?.marks ?? 0), 0),
    streakDays: streakFrom(days, now),
    firstSessionAt: starts.length > 0 ? new Date(Math.min(...starts)) : null,
  };
}
