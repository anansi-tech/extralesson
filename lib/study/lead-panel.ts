/**
 * WHETHER THE NOTEBOOK LEADS WITH "WHERE YOUR MARKS ARE".
 *
 * Extracted because the answer drives six separate render decisions — the panel
 * itself, and the size, padding and heading of the estimate beside it — and a
 * rule that many things depend on should be one thing that can be tested.
 *
 * It leads when the estimate would otherwise read as a verdict: no estimate
 * yet, or one below a passing mark. It does NOT lead on a cold account, which
 * is the clause that was missing (ROUND_3, defect 2):
 *
 *   pointsAvailable is (1 - mastery) * shareOfModule * 80 / moduleCount, so
 *   with no attempts every mastery is identical, the ranking collapses to
 *   blueprint weight, and every new student sees the same three topics under a
 *   heading that says "your". On a fresh account those are Module 2 and 3
 *   topics the M1 gate will not serve, sitting above an estimate that reads
 *   "Not yet estimated", on the screen whose job that day is the diagnostic.
 *
 * The protection the panel was written for — a demotivating U/U/U estimate —
 * is not needed on day one, because a cold account renders "Not yet estimated"
 * rather than a grade. One attempt is enough for the panel to mean something.
 */
export function shouldLeadWithReachable(args: {
  hasAnyAttempt: boolean;
  reachableCount: number;
  estimable: boolean;
  overallPercent: number;
}): boolean {
  const { hasAnyAttempt, reachableCount, estimable, overallPercent } = args;
  if (!hasAnyAttempt) return false;
  if (reachableCount === 0) return false;
  return !estimable || overallPercent < 50;
}
