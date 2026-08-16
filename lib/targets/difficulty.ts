// Difficulty, measured instead of asserted (R1.8 follow-up).
//
// The `difficulty` field is a label the generator assigns to itself, and a
// self-assigned label cannot be wrong, which is the problem with it. The 2024
// CSEC mean was 38%: these papers are hard, and nothing in our data says
// whether ours are. So two properties are derived from the rubric we already
// hold, both of them things an examiner would recognise.
//
// ACTS PER MARK — how finely the work is credited. A real mark scheme awards
// one mark per creditable act, so its ratio sits at 1. A rubric row worth three
// marks for "solves the equation" is one act priced at three, cannot award
// partial credit for the two steps a student did get, and hides how much work
// the question actually demands.
//
// CHAIN DEPTH — how far a result has to travel. A question of five independent
// one-step parts and a question whose fifth part rests on the first are not the
// same question, and marks alone cannot tell them apart. This is the property
// the papers use to make a question hard without making it longer.
//
// Chain depth is read from DECLARED dependencies, not from wording. Measured
// against six real papers plus the specimen, "hence" appears once or twice in a
// whole paper while the chaining is constant — the papers do not announce it.
// A prose detector would therefore measure how loudly a question signposts
// itself, and our own bank says "hence" in 72% of questions only because our
// prompt told it to. Steering by that number would have optimised the
// signposting and left the difficulty where it was.

export interface RubricRowLike {
  mark_value: number;
  criterion?: string;
}

export interface SlotLike {
  label: string;
  prompt?: string;
  /** Earlier slot refs whose results this slot uses, as declared. */
  depends_on?: string[];
}

export interface PartLike {
  label: string;
  prompt: string;
  slots?: SlotLike[];
}

export interface QuestionShapeLike {
  marks: number;
  parts?: PartLike[];
  rubric?: RubricRowLike[];
}

/**
 * Creditable acts per mark: rubric rows over the marks they carry.
 *
 * 1.0 matches a real mark scheme. Below 1.0 means rows are worth more than one
 * mark each and the marking is coarser than an examiner's. Above 1.0 would mean
 * rows worth less than a mark, which our schema does not allow.
 */
export function actsPerMark(q: QuestionShapeLike): number | null {
  const rubric = q.rubric ?? [];
  if (rubric.length === 0) return null;
  const marks = rubric.reduce((s, r) => s + r.mark_value, 0);
  return marks === 0 ? null : rubric.length / marks;
}

/**
 * Chain depth: the longest path through the declared dependency graph, counting
 * the slot it starts from.
 *
 * A question of independent one-step parts has depth 1 — there is always
 * something to do first. Depth 4 means a result travels through three further
 * slots before the question is done, which is how the papers make a question
 * hard without making it longer.
 *
 * Read from depends_on, never from wording. The papers say "hence" once or
 * twice in a whole paper and chain constantly; a prose detector measures how
 * loudly a question announces itself, which is the opposite of what we want to
 * steer by. Validation guarantees every ref points backwards, so the graph is
 * acyclic and the walk terminates.
 */
export function chainDepth(q: QuestionShapeLike): number {
  const refs: string[] = [];
  const edges = new Map<string, string[]>();
  for (const part of q.parts ?? []) {
    for (const slot of part.slots ?? []) {
      const ref = `${part.label}.${slot.label}`;
      refs.push(ref);
      edges.set(ref, slot.depends_on ?? []);
    }
  }
  if (refs.length === 0) return 0;

  const memo = new Map<string, number>();
  const depthOf = (ref: string): number => {
    const cached = memo.get(ref);
    if (cached !== undefined) return cached;
    const parents = (edges.get(ref) ?? []).filter((r) => edges.has(r));
    const d = parents.length === 0 ? 1 : 1 + Math.max(...parents.map(depthOf));
    memo.set(ref, d);
    return d;
  };
  return Math.max(...refs.map(depthOf));
}

export interface DifficultyProfile {
  acts_per_mark: number | null;
  chain_depth: number;
  /** Answerable things in the question, which chain depth is measured against. */
  steps: number;
}

export function difficultyProfile(q: QuestionShapeLike): DifficultyProfile {
  const steps = (q.parts ?? []).reduce((s, p) => s + Math.max(1, (p.slots ?? []).length), 0);
  return { acts_per_mark: actsPerMark(q), chain_depth: chainDepth(q), steps };
}

/** A distribution summary for a set of measured questions. */
export function summarise(values: number[]): {
  n: number;
  mean: number;
  median: number;
  min: number;
  max: number;
} {
  if (values.length === 0) return { n: 0, mean: 0, median: 0, min: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return {
    n: sorted.length,
    mean: sorted.reduce((s, v) => s + v, 0) / sorted.length,
    median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

// The targets these measures are steered toward. Set from the specimen
// calibration in scripts/report-difficulty.ts, not from taste.
export const TARGET_ACTS_PER_MARK = 1;
export const TARGET_CHAIN_DEPTH = 3;
