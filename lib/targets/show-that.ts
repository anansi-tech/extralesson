// SHOW THAT — the papers state the result and mark the route to it. The answer
// is printed in the question, so it cannot be machine-marked: the slot is
// self-marked against our solution and its marks stay out of the student's
// estimate (ROUND_1_6 §1). The share is measured the same way as
// CONSTRUCT_SHARE, over the five Paper 2s with a text layer: 8 of 55 questions.
export const SHOW_THAT_SHARE = 0.15;

/**
 * Whether a question already carries the demand — declared by the slot, never
 * detected in the wording. A stem that happens to contain the words "show
 * that" in an ordinary instruction is not this.
 */
export function hasShowThat(parts: { slots?: { response_mode?: string }[] }[] | undefined): boolean {
  return (parts ?? []).some((p) => (p.slots ?? []).some((s) => s.response_mode === 'show_that'));
}
