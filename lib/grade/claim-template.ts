import { parseNumeric } from './equivalence';
import { isMultiValue, readInputShape } from './input-shape';

/**
 * A CRITERION AS A CLAIM (ROUND_5 Task 1). Every literal in it that equals a
 * canonical value in scope — the row's slot, or one that slot depends on —
 * becomes a {part.slot} reference; anything else is a question constant and
 * stays literal. Ambiguity is reported, never resolved: a number that is
 * both a constant and an answer, or one literal matching two slots, keeps
 * the literal and is listed for a human glance.
 */
export interface ScopeSlot {
  ref: string;
  answer: string;
  depends_on?: string[];
}

/** A question as the deriver reads it: everything it states, and its slot graph. */
export interface Authored {
  stem: string;
  stimulus?: string;
  parts: { label: string; prompt: string; statement?: string; slots: { label: string; answer?: string; prompt?: string; depends_on?: string[] }[] }[];
  visual?: { params?: unknown };
  stimulus_table?: unknown;
  rubric?: { code: string; criterion: string; slot_ref: string; template?: string }[];
}

export interface Derived {
  template: string;
  refs: string[];
  ambiguous?: string;
}

/** A number as an author writes it: 1 200 000, 1\,200\,000, 12\%, \frac{12}{100}. */
const LITERAL = /\\[dt]?frac\{(-?\d+(?:\.\d+)?)\}\{(-?\d+(?:\.\d+)?)\}|-?\d+(?:(?:\\,| |,)\d{3})*(?:\.\d+)?/g;

function valueOf(literal: string, tail: string): number[] {
  const frac = literal.match(/^\\[dt]?frac\{(-?[\d.]+)\}\{(-?[\d.]+)\}$/);
  const n = frac ? Number(frac[1]) / Number(frac[2]) : Number(literal.replace(/\\,|,| /g, ''));
  if (!Number.isFinite(n)) return [];
  return /^\s*\\?%/.test(tail) ? [n / 100, n] : [n];
}

function canonicalValue(answer: string): number | null {
  const reading = readInputShape(answer);
  if (isMultiValue(reading.shape)) return null;
  return parseNumeric(answer);
}

const same = (a: number, b: number) => a === b || Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * 1e-9);

/** The row's slot and everything it depends on, transitively. */
export function scopeOf(slotRef: string, slots: Map<string, ScopeSlot>): ScopeSlot[] {
  const seen = new Set<string>();
  const out: ScopeSlot[] = [];
  const visit = (ref: string) => {
    if (seen.has(ref)) return;
    seen.add(ref);
    const s = slots.get(ref);
    if (!s) return;
    out.push(s);
    for (const d of s.depends_on ?? []) visit(d);
  };
  visit(slotRef);
  return out;
}

/**
 * EVERYTHING THE QUESTION STATES, and the cloze statement is part of that. It
 * was missing once, so a requirement written only in a statement — "the
 * required $55\%$" — was invisible as a CONSTANT and a criterion's 55 looked
 * like the student's answer alone. The ambiguity guard never fired, and nine
 * rows across three questions templated a fixed requirement as a student value:
 * a student whose part (b) read 67.3% was marked against "an amount equal to
 * 67.3% satisfies the condition at least 67.3%", true of any number at all.
 * Fixed 16 Sep; the statement is read here and nowhere else decides it.
 */
export function questionText(q: Authored): string {
  return [
    q.stem,
    q.stimulus ?? '',
    ...(q.parts ?? []).flatMap((p) => [p.prompt, p.statement ?? '', ...p.slots.map((s) => s.prompt ?? '')]),
    JSON.stringify(q.visual?.params ?? ''),
    JSON.stringify(q.stimulus_table ?? ''),
  ].join(' ');
}

/** The slot graph a row's scope is walked over. */
export function slotsOf(q: Authored): Map<string, ScopeSlot> {
  return new Map(
    (q.parts ?? []).flatMap((p) =>
      p.slots.map((s) => [`${p.label}.${s.label}`, { ref: `${p.label}.${s.label}`, answer: s.answer ?? '', depends_on: s.depends_on }] as const),
    ),
  );
}

/**
 * EVERY ROW'S CLAIM, derived once. The pipeline writes these onto the draft and
 * the gate derives them again to check what was written: one function, so a
 * template that passes the gate is the template the deriver would produce, and
 * an author cannot hand-write a reference the scope does not allow.
 */
export function templatesFor(q: Authored): { code: string; slotRef: string; derived: Derived }[] {
  const slots = slotsOf(q);
  const text = questionText(q);
  return (q.rubric ?? []).map((r) => ({
    code: r.code,
    slotRef: r.slot_ref,
    derived: deriveTemplate({ criterion: r.criterion, slotRef: r.slot_ref, slots, questionText: text }),
  }));
}

/**
 * The draft with every rubric row's template written on it. Both write paths
 * call this — generation and the operator's edit — so the gate that follows
 * checks a template the deriver produced rather than one a model invented.
 */
export function withTemplates<T extends Authored>(q: T): T {
  if (!q.rubric?.length) return q;
  const derived = new Map(templatesFor(q).map((t) => [t.code, t.derived]));
  return { ...q, rubric: q.rubric.map((r) => ({ ...r, template: derived.get(r.code)?.template ?? r.criterion })) };
}

export function deriveTemplate(args: {
  criterion: string;
  slotRef: string;
  slots: Map<string, ScopeSlot>;
  /** Everything the question states: stem, stimulus, prompts, figure data. */
  questionText: string;
}): Derived {
  const { criterion, slotRef, slots, questionText } = args;
  const scope = scopeOf(slotRef, slots)
    .map((s) => ({ ref: s.ref, value: canonicalValue(s.answer) }))
    .filter((s): s is { ref: string; value: number } => s.value !== null);
  const constants = new Set<number>();
  for (const m of questionText.matchAll(LITERAL)) {
    for (const v of valueOf(m[0], questionText.slice(m.index! + m[0].length, m.index! + m[0].length + 3))) constants.add(v);
  }

  const refs = new Set<string>();
  let ambiguous: string | undefined;
  const template = criterion.replace(LITERAL, (literal, _a, _b, offset: number) => {
    const values = valueOf(literal, criterion.slice(offset + literal.length, offset + literal.length + 3));
    const hits = scope.filter((s) => values.some((v) => same(v, s.value)));
    if (hits.length === 0) return literal;
    const uniqueRefs = [...new Set(hits.map((h) => h.ref))];
    if (uniqueRefs.length > 1) {
      ambiguous ??= `${literal} matches ${uniqueRefs.join(' and ')}`;
      return literal;
    }
    if (values.some((v) => constants.has(v))) {
      ambiguous ??= `${literal} is a question constant and the value of ${uniqueRefs[0]}`;
      return literal;
    }
    refs.add(uniqueRefs[0]);
    return `{${uniqueRefs[0]}}`;
  });

  if (ambiguous) return { template: criterion, refs: [], ambiguous };
  return { template, refs: [...refs] };
}

/**
 * The claim for THIS student: every reference becomes their confirmed answer
 * for that slot, or the canonical value where they left it empty. The marker
 * sees this and the page, nothing else.
 */
export function renderClaim(
  template: string,
  confirmed: Record<string, string>,
  canonical: Record<string, string>,
): string {
  return template.replace(/\{([a-j]\.[^{}]+)\}/g, (_m, ref: string, at: number) => {
    const theirs = confirmed[ref]?.trim();
    const value = theirs || canonical[ref];
    if (!value) return `{${ref}}`;
    return bare(value, template.slice(at + ref.length + 2, at + ref.length + 5));
  });
}

/**
 * A value typed by a student is plain text; the criterion around it is KaTeX.
 * Its own delimiters go, and its unit sign goes where the criterion already
 * writes one after the reference.
 */
function bare(value: string, after: string): string {
  let v = value.replace(/^\$+|\$+$/g, '').trim();
  if (/^\s*\\?%/.test(after)) v = v.replace(/\s*%$/, '');
  if (/^\s*(?:°|\^\{?\\circ)/.test(after)) v = v.replace(/\s*°$/, '');
  return v;
}

/**
 * Rows as the marker should see them: the claim rendered, the criterion kept
 * for the record.
 *
 * A TEMPLATE IS REQUIRED, and asking for it in the type is the point. This
 * read `r.template ?? r.criterion`, so a row without one was marked against
 * the author's literals — "CAO 47.5" shown to a student who answered 45 — and
 * nothing anywhere said so. The approval gate refuses such a row now, which is
 * where it can be fixed; here the fallback simply cannot be written.
 */
export function claimsFor<R extends { criterion: string; template: string }>(
  rows: R[],
  confirmed: Record<string, string>,
  canonical: Record<string, string>,
): (R & { claim: string })[] {
  return rows.map((r) => ({ ...r, claim: renderClaim(r.template, confirmed, canonical) }));
}
