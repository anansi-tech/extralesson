// Single source of mastery configuration (ROUND_1 §6.5).
// All bands and thresholds live here — nowhere else.

// Weighted fold over the last 5 attempts per objective; most recent first.
export const FOLD_WEIGHTS = [5, 4, 3, 2, 1] as const;

// Band cut-offs on the 0..1 mastery score. Assumptions, not CXC data:
// STRONG means consistently earning ~3/4 of available marks.
export const BANDS = {
  STRONG: 0.75,
  BUILDING: 0.4,
  // below BUILDING => WEAK; no attempts => NOT_STARTED
} as const;

export type MasteryBand = 'STRONG' | 'BUILDING' | 'WEAK' | 'NOT_STARTED';

// Cold-start prerequisite gate (ROUND_1 §6.2): until M1 module mastery
// exceeds this, sessions order M1 topics before M2/M3.
export const M1_PREREQ_THRESHOLD = 0.5;

// How much work an estimate needs before we are willing to state one.
//
// A fresh account has zero mastery, and zero mastery arithmetic produces U/U/U
// and an overall VI — which reads as a verdict on the student when it means we
// have never seen them work. Below this many attempts the UI states that there
// is no estimate yet instead of printing the arithmetic.
//
// One completed session (SESSION_SIZE questions). Kept here rather than in the
// session builder because it is a claim about evidence, not about sessions;
// a test asserts the two stay equal.
export const MIN_ATTEMPTS_FOR_PREDICTION = 8;
