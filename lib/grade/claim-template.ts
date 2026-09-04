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
  return template.replace(/\{([a-j]\.[^{}]+)\}/g, (_m, ref: string) => {
    const theirs = confirmed[ref]?.trim();
    return theirs || canonical[ref] || `{${ref}}`;
  });
}

/** Rows as the marker should see them: the claim rendered, the criterion kept for the record. */
export function claimsFor<R extends { criterion: string; template?: string }>(
  rows: R[],
  confirmed: Record<string, string>,
  canonical: Record<string, string>,
): (R & { claim: string })[] {
  return rows.map((r) => ({ ...r, claim: renderClaim(r.template ?? r.criterion, confirmed, canonical) }));
}
