export type LeadPanel = 'resume' | 'first' | 'diagnostic' | 'session';

/**
 * What the top of /study asks for. An open session always resumes; before
 * the first question the first question leads, with the diagnostic beneath
 * it (ROUND_4 Task 2); after it the diagnostic leads until an attempt exists.
 */
export function leadPanel(args: { open: boolean; firstTaken: boolean; isNewStudent: boolean }): LeadPanel {
  if (args.open) return 'resume';
  if (!args.firstTaken) return 'first';
  return args.isNewStudent ? 'diagnostic' : 'session';
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
