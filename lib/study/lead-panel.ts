export type LeadPanel = 'resume' | 'first' | 'diagnostic' | 'session';

/**
 * What the top of /study asks for: an open session, else the first question
 * until one exists, else the diagnostic until one exists, else the dashboard
 * (ROUND_4 Task 2). A diagnostic that reopens after the interval is offered
 * below, never pushed: the student has sessions to sit.
 */
export function leadPanel(args: { open: boolean; firstTaken: boolean; diagnosticTaken: boolean }): LeadPanel {
  if (args.open) return 'resume';
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
