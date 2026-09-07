export type LeadPanel = 'resume' | 'no-questions' | 'paywall' | 'sitting-passed' | 'first' | 'diagnostic' | 'session';

/** Whether a session may start today, as the gate answers for the usual session. */
export type SessionAccess = 'ok' | 'needs-access' | 'access-expired';

/**
 * What the top of /study asks for: an open session, else the refusal that
 * would meet any start — no questions, the paywall, a sitting that has passed
 * — else the first question until one exists, else the diagnostic until one
 * exists, else the dashboard (ROUND_4 Task 2). A refusal is the lead, never a
 * panel beneath a lead offering the refused thing. A diagnostic that reopens
 * after the interval is offered below, never pushed: the student has
 * sessions to sit.
 */
export function leadPanel(args: { open: boolean; questions: boolean; access: SessionAccess; firstTaken: boolean; diagnosticTaken: boolean }): LeadPanel {
  if (args.open) return 'resume';
  if (!args.questions) return 'no-questions';
  if (args.access === 'needs-access') return 'paywall';
  if (args.access === 'access-expired') return 'sitting-passed';
  if (!args.firstTaken) return 'first';
  if (!args.diagnosticTaken) return 'diagnostic';
  return 'session';
}

/**
 * Leads only where an estimate exists and is below a pass: the panel claims
 * "points your grade estimate could gain", and with no attempts every mastery
 * is equal, so the ranking collapses to blueprint weight for every student.
 */
export function shouldLeadWithReachable(args: {
  reachableCount: number;
  estimable: boolean;
  overallPercent: number;
}): boolean {
  const { reachableCount, estimable, overallPercent } = args;
  if (reachableCount === 0) return false;
  return estimable && overallPercent < 50;
}
