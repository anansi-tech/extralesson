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
