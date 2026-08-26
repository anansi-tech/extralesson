/**
 * WHETHER THE NOTEBOOK LEADS WITH "WHERE YOUR MARKS ARE".
 *
 * Extracted because the answer drives six render decisions — the panel itself,
 * and the size, padding and heading of the estimate beside it — and a rule that
 * many things depend on should be one thing that can be tested.
 *
 * THE PANEL NEEDS AN ESTIMATE, NOT AN ATTEMPT. Its own sentence is "the points
 * your grade estimate could gain from that topic", so it is only true when a
 * grade estimate exists. `estimable` is `marksAttempted >=
 * MIN_MARKS_FOR_PREDICTION`, which already implies attempts, so requiring one
 * separately said the same thing twice and said it too weakly.
 *
 * Leading while NOT estimable was the defect (ROUND_3, defect 2). It put the
 * panel above an estimate reading "Not yet estimated" — claiming points off a
 * grade that does not exist yet — and on a cold account it was worse than
 * untrue: pointsAvailable is (1 - mastery) * shareOfModule * 80 / moduleCount,
 * so with no attempts every mastery is identical, the ranking collapses to
 * blueprint weight, and every new student saw the same three topics under a
 * heading saying "your" — topics the M1 gate would not serve, on the screen
 * whose job that day is the diagnostic.
 *
 * The case the panel was written for survives intact: an estimate below a pass,
 * where a bare grade reads as a verdict. "Not yet estimated" was never the
 * demotivating thing.
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
