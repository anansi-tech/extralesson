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

// How much work an estimate needs before we state one: zero-mastery arithmetic
// produces a grade that reads as a verdict on a student we have never seen
// work. Measured in assessable MARKS, not questions (R1.8 §2), because a
// session is now one or two paper-shaped questions and counting those would
// state a grade off one. It is a claim about evidence, not about sessions.
export const MIN_MARKS_FOR_PREDICTION = 35;
