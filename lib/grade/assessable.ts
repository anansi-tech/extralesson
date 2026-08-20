/**
 * How many marks of a question we actually mark.
 *
 * The rubric is the answer and always was: every row names a slot, and a row
 * on an auto-marked slot is a mark we award. Two places asked the question a
 * different way and both got it wrong.
 *
 * The card divided by the question's TOTAL marks, so a 12-mark question with a
 * one-mark explain part told the student they had scored 11 out of 12 when 11
 * was everything on offer. Mastery approximated by slot proportion — a part's
 * marks times the share of its slots we mark — which for a 3-mark part with one
 * self-marked slot of three gives 2 marks rather than the 2 or 1 the rubric
 * actually places there. On this bank the approximation is wrong for 97 of 416
 * questions.
 */
export interface MarkableShape {
  parts?: { label: string; marks: number; slots?: { label: string; response_mode?: string }[] }[];
  rubric?: { slot_ref: string; mark_value: number }[];
  marks: number;
}

export interface MarkSplit {
  /** Marks on slots we mark automatically — the denominator for a score. */
  auto: number;
  /** Marks the student marks themselves, which count toward neither side. */
  self: number;
}

export function markSplit(q: MarkableShape): MarkSplit {
  const parts = q.parts ?? [];
  const rubric = q.rubric ?? [];

  const autoRefs = new Set(
    parts.flatMap((p) =>
      (p.slots ?? [])
        .filter((s) => (s.response_mode ?? 'answer') === 'answer')
        .map((s) => `${p.label}.${s.label}`),
    ),
  );

  if (rubric.length > 0 && autoRefs.size > 0) {
    const auto = rubric.filter((r) => autoRefs.has(r.slot_ref)).reduce((sum, r) => sum + r.mark_value, 0);
    if (auto > 0) return { auto, self: Math.max(0, q.marks - auto) };
  }

  // No rubric to read — an MCQ, or a question stored before rows named slots.
  // Whole parts still divide cleanly; only a part MIXING marked and self-marked
  // slots needs the rubric, and without it the honest fallback is to count the
  // part rather than invent a fraction of it.
  if (parts.length === 0) return { auto: q.marks, self: 0 };
  const auto = parts
    .filter((p) => (p.slots ?? []).some((s) => (s.response_mode ?? 'answer') === 'answer'))
    .reduce((sum, p) => sum + p.marks, 0);
  return { auto: auto || q.marks, self: Math.max(0, q.marks - (auto || q.marks)) };
}
