// Difficulty measured, not asserted: `difficulty` is a label the generator
// assigns itself, so two properties are derived from the rubric instead. ACTS
// PER MARK is how finely the work is credited, 1 in a real mark scheme. CHAIN
// DEPTH is how far a result travels, read from DECLARED dependencies because a
// prose detector would measure how loudly a question signposts itself.

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
 * Creditable acts per mark: rubric rows over the marks they carry. 1.0 matches
 * a real mark scheme; below 1.0 means rows are worth more than one mark each
 * and the marking is coarser than an examiner's. Above 1.0 the schema forbids.
 */
export function actsPerMark(q: QuestionShapeLike): number | null {
  const rubric = q.rubric ?? [];
  if (rubric.length === 0) return null;
  const marks = rubric.reduce((s, r) => s + r.mark_value, 0);
  return marks === 0 ? null : rubric.length / marks;
}

/**
 * The longest path through the declared dependency graph, counting the slot it
 * starts from. Read from depends_on, never from wording. Validation guarantees
 * every ref points backwards, so the walk terminates.
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
