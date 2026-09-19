import type { ScopeSlot } from '@/lib/grade/claim-template';

/**
 * HOW A QUESTION IS HANDED TO deriveTemplate. It lived in
 * scripts/done/backfill-rubric-template.ts, the same-commit backfill that
 * templated RubricItem.template once (ROUND_5 Task 1) and has long since run;
 * the script is gone and these two came here, which is where the only callers
 * are. Note that deriveTemplate has no caller in app/ or lib/ at all — it is
 * live code reached only from a test now.
 */
interface Q {
  stem: string;
  stimulus?: string;
  parts?: { label: string; prompt: string; statement?: string; slots: { label: string; answer: string; prompt?: string; depends_on?: string[] }[] }[];
  visual?: { params?: unknown };
  stimulus_table?: unknown;
}

/**
 * EVERYTHING THE QUESTION STATES, and the cloze statement is part of that. It
 * was missing, so a requirement written only in the statement — "the required
 * $55\%$" — was invisible as a CONSTANT, and a criterion's 55 looked like the
 * student's answer alone. deriveTemplate's ambiguity guard never fired, and
 * three rows templated the fixed requirement as {b.i}: a student whose part
 * (b) read 67.3% was marked against "an amount equal to 67.3% satisfies the
 * condition at least 67.3%", which is true of any number at all.
 */
export function questionText(q: Q): string {
  return [
    q.stem,
    q.stimulus ?? '',
    ...(q.parts ?? []).flatMap((p) => [p.prompt, p.statement ?? '', ...p.slots.map((s) => s.prompt ?? '')]),
    JSON.stringify(q.visual?.params ?? ''),
    JSON.stringify(q.stimulus_table ?? ''),
  ].join(' ');
}

export function slotsOf(q: Q): Map<string, ScopeSlot> {
  return new Map(
    (q.parts ?? []).flatMap((p) =>
      p.slots.map((s) => [`${p.label}.${s.label}`, { ref: `${p.label}.${s.label}`, answer: s.answer, depends_on: s.depends_on }] as const),
    ),
  );
}
