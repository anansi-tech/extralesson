/**
 * The rubric decides: a row on an auto-marked slot is a mark we award. A score's
 * denominator is those marks, never the question's total and never a proportion
 * of slots — a part may hold marks the student marks themselves.
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
  // Only a part MIXING marked and self-marked slots needs one, and without it
  // the honest fallback is to count the whole part, not invent a fraction.
  if (parts.length === 0) return { auto: q.marks, self: 0 };
  const auto = parts
    .filter((p) => (p.slots ?? []).some((s) => (s.response_mode ?? 'answer') === 'answer'))
    .reduce((sum, p) => sum + p.marks, 0);
  return { auto: auto || q.marks, self: Math.max(0, q.marks - (auto || q.marks)) };
}
