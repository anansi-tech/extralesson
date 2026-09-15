import { componentsEquivalent } from './components';
import { canEvaluate, looksMathematical } from './equivalence';
import { readInputShape } from './input-shape';
import { roundingOf } from './rounding';

/**
 * A QUESTION THAT DISAGREES WITH ITSELF IS BROKEN WHATEVER THE STUDENT WRITES.
 *
 * Found on a unit-vector slot whose canonical was `\frac{2}{\sqrt{29}}`: the
 * numeric conversion could not see a surd inside a fraction, so the slot's own
 * accept list did not compare equal to its own canonical — and no answer in any
 * notation could earn the marks. The conversion is fixed; this is the check that
 * makes the class report itself instead of waiting for a student to meet it.
 *
 * Two questions are asked of every answer slot, both through the SAME path a
 * student's answer takes — componentsEquivalent over the values readInputShape
 * splits out, with the slot's own rounding:
 *
 *   1. the canonical compares equal to ITSELF, and to itself after rewrites
 *      that change notation without changing value;
 *   2. every entry in the accept list compares equal to the canonical.
 *
 * Neither can fail for a reason to do with the student. A failure is ours.
 */
export interface SlotAgreement {
  ref: string;
  canonical: string;
  /** What failed: the rewrite's name, or the accept entry that disagreed. */
  failure: string;
  kind: 'self' | 'rewrite' | 'accept' | 'unparseable';
  /** The notation in the canonical, for grouping a sweep's findings. */
  notation: string[];
}

/** Rewrites a student may reasonably type, which must not change the value. */
const REWRITES: { name: string; apply: (s: string) => string }[] = [
  { name: '\\left and \\right stripped', apply: (s) => s.replace(/\\left|\\right/g, '') },
  { name: '\\times typed as ×', apply: (s) => s.replace(/\\times/g, '×') },
  { name: '\\div typed as ÷', apply: (s) => s.replace(/\\div/g, '÷') },
  { name: 'unicode superscripts', apply: (s) => s.replace(/\^2/g, '²').replace(/\^3/g, '³') },
  // `\ ` is a thin space, but `\\ ` is a matrix row separator followed by one:
  // eating the space out of that breaks the matrix, which is the check's fault
  // and not the question's.
  { name: 'spacing commands removed', apply: (s) => s.replace(/\\,|\\;|\\!|\\quad|\\qquad|(?<!\\)\\ /g, '') },
];

/** What a canonical is written with, so a sweep can group by cause. */
export function notationIn(answer: string): string[] {
  const found: string[] = [];
  if (/\\frac/.test(answer)) found.push('\\frac');
  if (/\\sqrt/.test(answer)) found.push('\\sqrt');
  if (/\\begin\{pmatrix\}/.test(answer)) found.push('pmatrix');
  if (/\\times|\\div/.test(answer)) found.push('\\times or \\div');
  if (/\\left|\\right/.test(answer)) found.push('\\left/\\right');
  if (/\\text/.test(answer)) found.push('\\text');
  if (/\\pi|π/.test(answer)) found.push('pi');
  if (/[²³]|\^/.test(answer)) found.push('powers');
  if (/\\,|\\;|\\!|\\quad/.test(answer)) found.push('spacing');
  return found.length ? found : ['plain'];
}

/**
 * Whether one slot agrees with itself. Returns the disagreements; an empty list
 * is a slot that means what it says.
 */
export function slotDisagreements(
  ref: string,
  slot: { answer?: string; accept?: string[]; response_mode?: string; answer_format?: string },
): SlotAgreement[] {
  const canonical = slot.answer;
  // Only slots a student types into: a construction is judged by its acts.
  if (!canonical || (slot.response_mode ?? 'answer') !== 'answer') return [];

  const rounding = roundingOf({ answer_format: slot.answer_format, canonical });
  const values = readInputShape(canonical).values;
  const agrees = (candidate: string) => componentsEquivalent(values, candidate, undefined, rounding);
  const out: SlotAgreement[] = [];
  const notation = notationIn(canonical);

  if (!agrees(canonical)) out.push({ ref, canonical, failure: 'the canonical does not equal itself', kind: 'self', notation });

  for (const { name, apply } of REWRITES) {
    const rewritten = apply(canonical);
    if (rewritten === canonical) continue;
    if (!agrees(rewritten)) out.push({ ref, canonical, failure: name, kind: 'rewrite', notation });
  }

  /**
   * AN ACCEPT ENTRY IS NOT ALWAYS THE SAME VALUE. For a prose answer it is an
   * accepted PHRASING — "No" beside "cannot" — and for some it is a unit the
   * comparison cannot convert: "75 min" beside "1 h 15 min" is right and will
   * never compare equal. Both are doing real work at marking time, where any
   * listed form is accepted on its own.
   *
   * So the check asks only what it can answer: where BOTH the canonical and the
   * entry are values this comparison can evaluate, they must agree. Anything
   * else is not checked, and says so rather than passing quietly.
   */
  for (const entry of slot.accept ?? []) {
    if (!looksMathematical(canonical) || !looksMathematical(entry)) continue;
    if (!agrees(entry)) out.push({ ref, canonical, failure: entry, kind: 'accept', notation });
  }

  /**
   * AND WHAT THE COMPARATOR CANNOT EVALUATE IS SAID, NEVER ABSTAINED ON.
   *
   * A value it cannot get a number or an expression out of falls through to a
   * STRING comparison, where it equals itself and nothing else. The checks
   * above then pass for the wrong reason: the canonical equals itself as text,
   * and an accept entry written any other way is skipped. \sqrt[3]{X} sat
   * there for the life of the bank, and the sweep said the question was fine.
   *
   * PROSE IS NOT THIS. "No" beside "cannot" is compared as words, deliberately
   * and correctly, so a value read as a word is left alone.
   */
  for (const [whole, source] of [[canonical, 'the answer'], ...(slot.accept ?? []).map((e) => [e, `accept ${JSON.stringify(e)}`] as const)] as [string, string][]) {
    const reading = readInputShape(whole);
    if (reading.shape === 'word') continue;
    const blind = reading.values.filter((v) => !canEvaluate(v));
    if (blind.length === 0) continue;
    out.push({
      ref,
      canonical,
      failure: `${source} cannot be evaluated: ${blind.map((v) => JSON.stringify(v)).join(', ')} (read as ${reading.shape})`,
      kind: 'unparseable',
      notation: notationIn(whole),
    });
  }
  return out;
}

/** Every disagreement in a question, across its slots. */
export function questionDisagreements(parts: { label: string; slots?: { label: string; answer?: string; accept?: string[]; response_mode?: string; answer_format?: string }[] }[]): SlotAgreement[] {
  return parts.flatMap((p) => (p.slots ?? []).flatMap((s) => slotDisagreements(`${p.label}.${s.label}`, s)));
}
