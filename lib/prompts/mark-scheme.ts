import type { Profile } from '@/lib/types';

// R1.7 Part C — the mark scheme's own descriptor vocabulary, defined in this
// one place: the generation prompt teaches it, the lint checks it, and the
// grader marks against it. Our rubric IS the official scheme's notation rather
// than an approximation of it, so the criteria read the same way.

export const MARK_SCHEME_CONVENTIONS = `MARK-SCHEME LANGUAGE (the official scheme's own):
- "CAO" — correct answer only: the mark is for the final value, with no credit for method. Usually a CK mark.
- "method" / "process" — the mark is for a correct procedure, and is earned even when a downstream arithmetic slip spoils the value. Usually an AK mark.
- Follow-through: a later mark is earned when the method is right and the input is the candidate's OWN earlier answer, even when that answer was wrong. The scheme writes the candidate's value in quotes — "their" total, "their" gradient — and a criterion that depends on an earlier part must be worded that way.
- R marks attach to: forming an equation from words, choosing or justifying a method, stating a result in a required form, describing or interpreting a result, and reading correctly from a diagram or graph.
- Each criterion names one creditable act, in the scheme's telegraphic register — "Substitutes into the compound-interest formula", "CAO 47.5", "Divides 'their' total by 8" — not a sentence about what the student understands.`;

// Canonical descriptors, taught to the model as examples of the register. The
// lint does NOT check membership of this list — see opensWithAnAct below: a
// curated verb list is endless, and flagged a quarter of sound rubric rows.
export const CRITERION_VERBS = [
  'cao',
  'method',
  'process',
  'substitutes',
  'substitutes into',
  'forms',
  'writes',
  'states',
  'expresses',
  'calculates',
  'computes',
  'evaluates',
  'finds',
  'obtains',
  'deduces',
  'shows',
  'solves',
  'simplifies',
  'expands',
  'factorises',
  'rearranges',
  'transposes',
  'applies',
  'uses',
  'selects',
  'identifies',
  'reads',
  'plots',
  'draws',
  'describes',
  'interprets',
  'compares',
  'concludes',
  'justifies',
  'explains',
  'divides',
  'multiplies',
  'adds',
  'subtracts',
  'converts',
  'rounds',
  'equates',
] as const;

export interface CriterionIssue {
  part_label: string;
  code: string;
  issue: string;
}

const FOLLOW_THROUGH_RE = /["“]their["”]|follow[- ]through/i;

// The scheme's register is one creditable ACT in the third-person singular.
// That shape is checkable without curating a word list, which is the point:
// the shape is what the convention actually is.
const SCHEME_IDIOMS = new Set(['cao', 'method', 'process', 'follow-through', 'ft']);

function opensWithAnAct(text: string): boolean {
  const first = text.trim().toLowerCase().split(/[\s,:]+/)[0]?.replace(/[^a-z-]/g, '') ?? '';
  if (SCHEME_IDIOMS.has(first)) return true;
  // third-person singular verb: ends in s, not a plural-looking noun phrase
  return /^[a-z]{3,}s$/.test(first) && !first.endsWith('ss');
}
const STUDENT_STATE_RE = /\b(understand(?:s|ing)?|knows?|realis|realiz|appreciates?|is able to|grasps?)\b/i;

/**
 * Lint rubric criteria against the scheme's conventions (R1.7 §B3). Advisory:
 * it reports, it does not reject — a criterion can be well-formed English and
 * still be worth rewriting, and that judgement belongs to the reviewer.
 */
export function lintCriteria(
  rubric: { code: string; criterion: string; part_label: string; profile: Profile }[],
): CriterionIssue[] {
  const issues: CriterionIssue[] = [];
  for (const r of rubric) {
    const text = r.criterion.trim();
    const lower = text.toLowerCase();
    if (!opensWithAnAct(lower)) {
      issues.push({
        part_label: r.part_label,
        code: r.code,
        issue: `criterion should name an act, in the scheme's register (${CRITERION_VERBS.slice(0, 5).join(', ')}, …): "${text.slice(0, 60)}"`,
      });
    }
    if (STUDENT_STATE_RE.test(text)) {
      issues.push({
        part_label: r.part_label,
        code: r.code,
        issue: `criterion marks a state of mind rather than a creditable act: "${text.slice(0, 60)}"`,
      });
    }
    if (text.length > 90) {
      issues.push({
        part_label: r.part_label,
        code: r.code,
        issue: `criterion is a sentence, not a scheme entry (${text.length} chars)`,
      });
    }
  }
  return issues;
}

/** True when a criterion is worded as depending on the candidate's own value. */
export function isFollowThrough(criterion: string): boolean {
  return FOLLOW_THROUGH_RE.test(criterion);
}
