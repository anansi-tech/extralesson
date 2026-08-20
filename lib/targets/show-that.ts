// SHOW THAT — the papers state the result and mark the route to it.
//
// "Show that the area is 48 cm²", "Prove that the triangles are similar". The
// answer is printed in the question, so a typed answer proves nothing and we
// cannot machine-mark it: the slot is self-marked against our solution, exactly
// as an "explain" slot is, and its marks stay out of the student's estimate.
//
// That is precisely why it went missing. Nothing declared it, the gates could
// not want it, and the model reaches for the demand it can be graded on — so
// the bank arrived at 12 questions in 292 (4%) carrying a pattern the papers
// use constantly, while "explain" reached 62% unasked.
//
// SHARE — measured the same way as CONSTRUCT_SHARE in ./construct.ts, over the
// same five May/June Paper 2 papers that carry a usable text layer (2016-2019,
// 2021; the other ten reference papers are image-only). Counting a question as
// carrying the demand if any of its parts states a result and asks for the
// working:
//
//   8 of 55 questions — 15%. Ten demands in total, because a question that
//   sets one often sets two.
//
// It coincides with the construct share at 15%, which is a coincidence and not
// a shared cause: the two land on different questions, overlapping on one.
export const SHOW_THAT_SHARE = 0.15;

/**
 * Whether a question already carries the demand — declared by the slot, never
 * detected in the wording. A stem that happens to contain the words "show
 * that" in an ordinary instruction is not this.
 */
export function hasShowThat(parts: { slots?: { response_mode?: string }[] }[] | undefined): boolean {
  return (parts ?? []).some((p) => (p.slots ?? []).some((s) => s.response_mode === 'show_that'));
}
