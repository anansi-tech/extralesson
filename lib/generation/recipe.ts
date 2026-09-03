import {
  DIFFICULTY_TARGETS,
  largestDeficit,
  P1_PROFILE_SPLIT,
  P2_PROFILE_SPLIT,
  MCQ_ARCHETYPE_TARGETS,
  P1_TOTAL,
  P2_MARKS_TOTAL,
  REPRESENTATION_TARGETS,
  STRUCTURED_ARCHETYPE_TARGETS,
  type Matrix,
} from '@/lib/targets/matrix';
import {
  GRID_BIAS,
  GRID_BIASED_OBJECTIVES,
  MCQ_VISUAL_SHARE,
  type RepresentationTarget,
} from '@/lib/targets/representation';
import {
  INTEGRATION_MIN_OBJECTIVES,
  MULTI_TOPIC_SHARE,
  naturalPartners,
} from '@/lib/targets/pairings';
import { CONSTRUCT_SHARE, isConstructTemplate } from '@/lib/targets/construct';
import { SHOW_THAT_SHARE } from '@/lib/targets/show-that';
import { OBJECTIVE_FLOOR } from '@/lib/targets/objectives';
import { TEMPLATES_BY_REPRESENTATION } from '@/lib/validation/question';
import type { Archetype, Profile, Representation, TemplateName } from '@/lib/types';

const PROFILES: Profile[] = ['CK', 'AK', 'R'];

/**
 * Marks per profile for one question, pulled toward the profile the bank is
 * shortest of, so the mix converges instead of sitting still. Largest
 * remainder keeps the marks summing to the question's total exactly.
 */
export function rubricSplitFor(
  marks: number,
  target: Record<Profile, number>,
  actual: Record<Profile, number>,
): Record<Profile, number> {
  const targetTotal = PROFILES.reduce((s, p) => s + target[p], 0);
  const actualTotal = PROFILES.reduce((s, p) => s + (actual[p] ?? 0), 0);

  const weights = PROFILES.map((p) => {
    const want = target[p] / targetTotal;
    const have = actualTotal === 0 ? want : (actual[p] ?? 0) / actualTotal;
    // Aim past the target by the size of the shortfall, never below a floor:
    // a profile that is already over-represented still appears, just less.
    return Math.max(0.05, want + (want - have));
  });
  const weightTotal = weights.reduce((s, w) => s + w, 0);

  const exact = weights.map((w) => (w / weightTotal) * marks);
  const split = exact.map((v) => Math.floor(v));
  let left = marks - split.reduce((s, v) => s + v, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    split[i]++;
    left--;
  }

  // A question big enough to carry all three carries all three: zeroing a
  // profile out to correct a skew is the same defect pointed the other way.
  if (marks >= 6) {
    for (let i = 0; i < split.length; i++) {
      if (split[i] > 0) continue;
      const biggest = split.indexOf(Math.max(...split));
      if (split[biggest] <= 1) break;
      split[biggest]--;
      split[i]++;
    }
  }
  return { CK: split[0], AK: split[1], R: split[2] };
}

// The 6-field recipe — see ROUND_1_5 §5.
export interface QuestionRecipe {
  objective_ids: string[];
  kind: 'mcq' | 'structured';
  difficulty: 1 | 2 | 3;
  marks: number;
  archetype: Archetype;
  representation: Representation;
  /** Paper 1 only: fixed here so a topic's items ramp CK -> AK -> R. */
  profile?: Profile;
  /**
   * Structured only: marks of this question's rubric each profile must carry,
   * summing to `marks`. Left to the model, the split reaches for procedure.
   */
  rubric_split?: Record<Profile, number>;
  /**
   * 'paper' is what the exam sets (9-12 marks, 2-4 chaining lettered parts);
   * 'drill' is a short single-slot item. MCQs are always drill — ROUND_1_8 §2.
   */
  shape: 'paper' | 'drill';
  /**
   * Difficulty-3 structured only: chain the objectives through one scenario,
   * a slot naming each.
   */
  integrate?: boolean;
  /**
   * Paper-shaped structured only: opens with a drawing part that later parts
   * interrogate. The construct part is self-marked; the rest is not.
   */
  construct?: boolean;
  /**
   * Paper-shaped structured only: one part states its result and marks the
   * route to it. Self-marked.
   */
  show_that?: boolean;
}

// Derived from the recipe rather than part of the six fields.
export interface RecipeContext {
  /** The topic the deficit search chose; the question is filed under it. */
  topic_code: string;
  /** Every topic the objectives came from, primary first — ROUND_1_8 §2. */
  topic_codes: string[];
  template_hints: TemplateName[];
}

export interface ObjectiveCoverage {
  id: string;
  approved: number; // floor: ≥2 approved per objective — ROUND_1_5 §4
  /**
   * Approved plus draft. The recipe steers by this; steering on `approved`
   * alone never moves, since nothing a run writes is approved yet.
   */
  covered: number;
}

// Anchored on the 2027 blueprint (30 marks / 3 questions); drill items run
// smaller than an exam question at low difficulty.
export const STRUCTURED_MARKS: Record<1 | 2 | 3, number> = { 1: 5, 2: 7, 3: 9 };

// The size the exam sets — ROUND_1_8 §2. Difficulty decides, so marks stay
// derived from the settled recipe rather than chosen twice.
export const PAPER_MARKS: Record<1 | 2 | 3, number> = { 1: 9, 2: 10, 3: 12 };



// CLI overrides CONSTRAIN the deficit search; they are never applied to a
// finished recipe, so downstream fields cannot mix a choice made for one kind
// with tables belonging to another.
export interface RecipeOverrides {
  topic_code?: string;
  kind?: 'mcq' | 'structured';
  difficulty?: 1 | 2 | 3;
  /** Confine the deficit search to one module (bulk fill, module by module). */
  module?: 1 | 2 | 3;
  /** Ask for a short drill item instead of the paper-shaped default. */
  shape?: 'paper' | 'drill';
}

/** Difficulty-3 structured questions integrate within ONE topic, so they never pair. */
function integrateWanted(kind: string, shape: string, difficulty: number): boolean {
  return kind === 'structured' && shape === 'paper' && difficulty === 3;
}

export function nextRecipe(
  matrix: Matrix,
  objectivesByTopic: Map<string, ObjectiveCoverage[]>,
  overrides: RecipeOverrides = {},
): { recipe: QuestionRecipe; context: RecipeContext } {
  // 1. Paper: larger proportional shortfall wins (tie → P2, the bigger bank).
  // P1 is item-counted and P2 marks-counted, each in its own unit: a 12-mark
  // question and a 4-mark one are not the same amount of P2 — ROUND_1_8 §2.
  const p1Shortfall = (P1_TOTAL - matrix.p1_actual_total) / P1_TOTAL;
  const p2Shortfall = (P2_MARKS_TOTAL - matrix.p2_marks_actual_total) / P2_MARKS_TOTAL;
  const kind: 'mcq' | 'structured' =
    overrides.kind ?? (p1Shortfall > p2Shortfall ? 'mcq' : 'structured');
  const shape: 'paper' | 'drill' =
    kind === 'mcq' ? 'drill' : (overrides.shape ?? 'paper');

  const leastApproved = (code: string) =>
    [...(objectivesByTopic.get(code) ?? [])].sort(
      (a, b) => a.covered - b.covered || (a.id < b.id ? -1 : 1),
    );

  // OBJECTIVE COVERAGE, ranked ahead of topic marks. A topic ranked by its
  // share of blueprint MARKS alone is never chosen again once over quota, so
  // its untouched objectives stay untouched: 65 of 150 had never been assessed.
  // While any objective is below the floor, coverage outranks marks; once the
  // floor is met everywhere, marks decide again. ROUND_1_5 §4.
  const uncovered = (code: string, below: number) =>
    (objectivesByTopic.get(code) ?? []).filter((o) => o.covered < below).length;

  // 2. Topic: largest deficit vs the paper's blueprint-derived targets.
  const topicTargets: Record<string, number> = {};
  const topicActuals: Record<string, number> = {};
  for (const t of matrix.topics) {
    // A module override narrows the search; the largest deficit inside it wins.
    if (overrides.module && t.module !== overrides.module) continue;
    topicTargets[t.code] = kind === 'mcq' ? t.p1_target : t.p2_marks_target;
    topicActuals[t.code] = kind === 'mcq' ? t.p1_actual : t.p2_marks_actual;
  }
  // Floor 1 before floor 2 everywhere: no topic goes to a second question on an
  // objective while another topic still has an objective at zero.
  const candidates = Object.keys(topicTargets);
  const byCoverage = (below: number) => {
    const gaps = candidates.map((code) => ({ code, gap: uncovered(code, below) })).filter((c) => c.gap > 0);
    if (gaps.length === 0) return null;
    const most = Math.max(...gaps.map((g) => g.gap));
    // Among topics equally short of coverage, the marks deficit breaks the tie.
    const tied = gaps.filter((g) => g.gap === most).map((g) => g.code);
    return tied.length === 1
      ? tied[0]
      : largestDeficit(
          Object.fromEntries(tied.map((c) => [c, topicTargets[c]])),
          Object.fromEntries(tied.map((c) => [c, topicActuals[c]])),
        );
  };
  const topic =
    overrides.topic_code ??
    byCoverage(1) ??
    byCoverage(OBJECTIVE_FLOOR) ??
    largestDeficit(topicTargets, topicActuals);
  const row = matrix.topics.find((t) => t.code === topic);
  if (!row) throw new Error(`unknown topic ${topic}`);

  // 3. Difficulty: 25/50/25 target minus actuals, settled before the objectives
  //    because it decides how many a recipe carries. An integrated difficulty-3
  //    question is the cheapest coverage there is, but stays bounded by the
  //    band: unbounded, every question becomes difficulty 3 and 25/50/25 never
  //    converges.
  const dActuals = matrix.difficulty_actuals[kind];
  const dTotal = dActuals[1] + dActuals[2] + dActuals[3];
  const dTargetTotal = DIFFICULTY_TARGETS[1] + DIFFICULTY_TARGETS[2] + DIFFICULTY_TARGETS[3];
  const d3RoomLeft = (dTotal === 0 ? 0 : dActuals[3] / dTotal) < DIFFICULTY_TARGETS[3] / dTargetTotal;
  const zerosHere = uncovered(topic, 1);
  const difficulty: 1 | 2 | 3 =
    overrides.difficulty ??
    (kind === 'structured' && zerosHere >= INTEGRATION_MIN_OBJECTIVES && d3RoomLeft
      ? 3
      : (Number(
          largestDeficit(
            DIFFICULTY_TARGETS as unknown as Record<string, number>,
            matrix.difficulty_actuals[kind] as unknown as Record<string, number>,
          ),
        ) as 1 | 2 | 3));

  // 4. Objectives (least-approved first). Chosen before the representation
  //    because coordinate work has to be plotted, and a field must derive from
  //    its inputs rather than be patched afterwards.

  // A paper-shaped question is SINGLE-TOPIC unless the corpus says otherwise:
  // requiring two topics everywhere produced stapled parts. 13% of 104 real
  // questions pair two topics of one module, so pairing is a deficit like the
  // rest — pair only where the corpus pairs, and only while below that share.
  const topic_codes = [topic];
  if (shape === 'paper' && !integrateWanted(kind, shape, difficulty)) {
    const pairedSoFar =
      matrix.p2_actual_total === 0 ? 0 : matrix.multi_topic_actual / matrix.p2_actual_total;
    if (pairedSoFar < MULTI_TOPIC_SHARE) {
      const partner = naturalPartners(topic)
        .filter((code) => {
          const t = matrix.topics.find((x) => x.code === code);
          return t && t.module === row.module && (objectivesByTopic.get(code)?.length ?? 0) > 0;
        })
        // Among the partners the corpus allows, take the one we are shortest of.
        .sort((a, b) => {
          const ta = matrix.topics.find((x) => x.code === a)!;
          const tb = matrix.topics.find((x) => x.code === b)!;
          return (
            tb.p2_marks_target - tb.p2_marks_actual - (ta.p2_marks_target - ta.p2_marks_actual) ||
            (a < b ? -1 : 1)
          );
        })[0];
      if (partner) topic_codes.push(partner);
    }
  }

  // INTEGRATION, difficulty 3 structured only: one topic, several objectives
  // chained through one scenario. The three least-approved objectives are often
  // adjacent ids; selecting instead for a wider objective SPAN was measured and
  // refuted — span does not predict distinct skills — so do not re-derive it.
  // The known fix, if quality needs raising, is per-topic technique groups.
  const integrate = integrateWanted(kind, shape, difficulty);

  // Otherwise one objective per topic — the breadth comes from the topics.
  const objective_ids = integrate
    ? leastApproved(topic).slice(0, INTEGRATION_MIN_OBJECTIVES).map((o) => o.id)
    : shape === 'paper'
      ? topic_codes.flatMap((code) => leastApproved(code).slice(0, 1).map((o) => o.id))
      : leastApproved(topic)
          .slice(0, kind === 'structured' && difficulty >= 2 ? 2 : 1)
          .map((o) => o.id);
  if (objective_ids.length === 0) {
    throw new Error(`no objectives known for topic ${topic}`);
  }
  const gridBiased = objective_ids.some((id) => GRID_BIASED_OBJECTIVES.has(id));

  // 5. Representation: topic targets minus topic actuals. For a Paper 1 item
  //    the visual/prose decision comes first, from the global share as a TARGET
  //    rather than a ceiling — as a ceiling the bank reached 53% visual.
  const repTargets: RepresentationTarget[] = REPRESENTATION_TARGETS[topic] ?? [
    { representation: 'prose', share: 100, template_hints: [] },
  ];
  const repTargetRecord: Record<string, number> = {};
  for (const r of repTargets) repTargetRecord[r.representation] = r.share;
  // Weighting, not gating: 'graph' becomes the likely choice for coordinate
  // work while a genuine surplus can still send the recipe elsewhere.
  if (gridBiased && repTargetRecord.graph !== undefined) {
    repTargetRecord.graph += GRID_BIAS;
  }
  let representation = largestDeficit(
    repTargetRecord,
    row.representation_actuals as Record<string, number>,
  ) as Representation;
  if (kind === 'mcq') {
    // Visual-or-prose is its own deficit against the corpus share; WHICH visual
    // still comes from the topic's own table above.
    const visualShare =
      matrix.p1_actual_total === 0 ? 0 : matrix.mcq_visual_actual / matrix.p1_actual_total;
    const wantVisual = visualShare < MCQ_VISUAL_SHARE;
    const visualOptions = repTargets.filter((r) => r.representation !== 'prose');
    if (!wantVisual) {
      representation = 'prose';
    } else if (representation === 'prose' && visualOptions.length > 0) {
      representation = largestDeficit(
        Object.fromEntries(visualOptions.map((r) => [r.representation, repTargetRecord[r.representation]])),
        row.representation_actuals as Record<string, number>,
      ) as Representation;
    }
  }
  // TEMPLATE DEFICIT, INSIDE THE REPRESENTATION. An unordered hint list let a
  // template the bank had none of compete on equal footing with one it had 144
  // of, and lose every time. Fewest-first is the whole rule; no new constants.
  const template_hints = [
    ...(repTargets.find((r) => r.representation === representation)?.template_hints ?? []),
  ].sort(
    (a, b) => (matrix.template_actuals[a] ?? 0) - (matrix.template_actuals[b] ?? 0),
  );

  // 6. Archetype: global per-kind targets minus actuals.
  const archetype = largestDeficit(
    (kind === 'mcq' ? MCQ_ARCHETYPE_TARGETS : STRUCTURED_ARCHETYPE_TARGETS) as Record<
      Archetype,
      number
    >,
    matrix.archetype_actuals[kind],
  );


  // CONSTRUCT-THEN-INTERROGATE — see ROUND_1_9. A deficit like every other
  // target, gated on the template the representation deficit already chose, and
  // asking for one NARROWS the hints rather than merely being allowed by them.
  // Eligibility is checked against the CANONICAL map too: per-topic hints can
  // disagree with the schema, and such a recipe could never validate.
  const validHere: TemplateName[] =
    representation === 'prose' ? [] : TEMPLATES_BY_REPRESENTATION[representation];
  const constructHints = template_hints.filter(
    (t) => isConstructTemplate(t) && validHere.includes(t),
  );
  const constructedSoFar =
    matrix.p2_actual_total === 0 ? 0 : matrix.construct_actual / matrix.p2_actual_total;

  // SHOW THAT: a deficit like integration — see ROUND_1_6 §1. Never on the same
  // question as a construction, since both parts are self-marked and a 12-mark
  // question marked only in its middle is neither shape. So the two compete and
  // the one further behind takes the question; letting construction always win
  // spent the whole budget on one target.
  const shownSoFar =
    matrix.p2_actual_total === 0 ? 0 : matrix.show_that_actual / matrix.p2_actual_total;
  const wantsDemand = kind === 'structured' && shape === 'paper';
  const constructGap = constructHints.length > 0 ? CONSTRUCT_SHARE - constructedSoFar : -Infinity;
  const showThatGap = SHOW_THAT_SHARE - shownSoFar;
  const construct = wantsDemand && constructGap > 0 && constructGap >= showThatGap;
  const show_that = wantsDemand && !construct && showThatGap > 0;

  const marks =
    kind === 'mcq' ? 1 : shape === 'paper' ? PAPER_MARKS[difficulty] : STRUCTURED_MARKS[difficulty];

  // 7. Profile: both papers take it from the same per-module deficit, which
  //    converges at any topic size. A fixed cycle starved R on topics holding
  //    fewer items than the cycle is balanced over.
  const moduleProfiles = matrix.profile_actuals[row.module];
  const profile =
    kind === 'mcq'
      ? (largestDeficit(P1_PROFILE_SPLIT, moduleProfiles.p1) as Profile)
      : undefined;
  const rubric_split =
    kind === 'structured' ? rubricSplitFor(marks, P2_PROFILE_SPLIT, moduleProfiles.p2) : undefined;

  return {
    recipe: {
      objective_ids,
      kind,
      difficulty,
      marks,
      archetype,
      representation,
      profile,
      rubric_split,
      shape,
      ...(integrate ? { integrate: true } : {}),
      ...(construct ? { construct: true } : {}),
      ...(show_that ? { show_that: true } : {}),
    },
    context: { topic_code: topic, topic_codes, template_hints: construct ? constructHints : template_hints },
  };
}
