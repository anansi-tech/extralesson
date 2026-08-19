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
import type { Archetype, Profile, Representation, TemplateName } from '@/lib/types';

const PROFILES: Profile[] = ['CK', 'AK', 'R'];

/**
 * Marks per profile for one question, pulled toward whichever profile the bank
 * is shortest of.
 *
 * The base target is the blueprint split; the correction is the shortfall
 * against it, so a bank at 21% CK asks the next question for more CK than the
 * steady-state 30% and the mix converges instead of sitting still. Largest
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

  // A question big enough to carry all three carries all three. Correcting a
  // skew by zeroing a profile out is the same failure the correction exists to
  // fix, pointed the other way — and a 10-mark paper question with no reasoning
  // mark, or none for knowing what to do, is not what the papers set.
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

// R1.5 §5 — the 6-field recipe. The generator computes the largest matrix
// deficit and emits recipes; the model no longer free-chooses objectives.
export interface QuestionRecipe {
  objective_ids: string[];
  kind: 'mcq' | 'structured';
  difficulty: 1 | 2 | 3;
  marks: number;
  archetype: Archetype;
  representation: Representation;
  /**
   * Paper 1 only (R1.7 §B5): the cognitive level this item must assess. The
   * recipe fixes it so a topic's items ramp CK -> AK -> R as the real paper's
   * topic blocks do, instead of the model choosing one item at a time.
   */
  profile?: Profile;
  /**
   * Structured only: how many marks of this question's rubric each profile must
   * carry, summing to `marks`.
   *
   * A target the recipe does not consume is a wish. CK/AK/R was declared
   * 30/40/30 and sat at 21/55/24 because a structured recipe carried no profile
   * at all — the split was left to the model, which reaches for procedure.
   */
  rubric_split?: Record<Profile, number>;
  /**
   * R1.8 §2. A 'paper' question is what the exam actually sets: 9-12 marks,
   * 2-4 lettered parts, objectives drawn from two or three topics in one
   * module, parts chaining into each other. A 'drill' item is the short
   * single-slot practice item the bank is currently made of — still a valid
   * category, no longer the default. MCQs are always drill.
   */
  shape: 'paper' | 'drill';
  /**
   * Difficulty-3 structured only: this question must chain its objectives
   * through one scenario, with a slot naming each. The hardest class the papers
   * set, and the one the bank had almost none of.
   */
  integrate?: boolean;
}

// Extra context the prompt needs that is derived from the recipe (not part of
// the six fields): which templates fit the representation for this topic.
export interface RecipeContext {
  /** The topic the deficit search chose; the question is filed under it. */
  topic_code: string;
  /** Every topic the objectives came from, primary first (§2 multi-topic). */
  topic_codes: string[];
  template_hints: TemplateName[];
}

export interface ObjectiveCoverage {
  id: string;
  approved: number; // floors: ≥2 approved per objective where sensible (§4)
}

// Marks by difficulty for structured questions. Documented assumption
// anchored on the 2027 blueprint (30 marks / 3 questions ≈ 10 per exam
// question; bank items run smaller at low difficulty).
export const STRUCTURED_MARKS: Record<1 | 2 | 3, number> = { 1: 5, 2: 7, 3: 9 };

// R1.8 §2 — a paper-shaped question is the size the exam sets: 9-10 marks for a
// standard question and 12 for an extended one. Difficulty still decides, so
// that marks remain derived from the settled recipe rather than chosen twice.
export const PAPER_MARKS: Record<1 | 2 | 3, number> = { 1: 9, 2: 10, 3: 12 };



// CLI overrides. These CONSTRAIN the deficit search — they are never applied
// to a finished recipe. Every downstream field (representation, archetype,
// difficulty, marks) is derived from the constrained values, so a recipe can
// never mix a choice made for one kind with tables belonging to another.
export interface RecipeOverrides {
  topic_code?: string;
  kind?: 'mcq' | 'structured';
  difficulty?: 1 | 2 | 3;
  /** Confine the deficit search to one module (bulk fill, module by module). */
  module?: 1 | 2 | 3;
  /** Ask for a short drill item instead of the paper-shaped default (§2). */
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
  // P1 is item-counted and P2 is marks-counted, each in its own unit (§2): a
  // 12-mark question and a 4-mark one are not the same amount of P2.
  const p1Shortfall = (P1_TOTAL - matrix.p1_actual_total) / P1_TOTAL;
  const p2Shortfall = (P2_MARKS_TOTAL - matrix.p2_marks_actual_total) / P2_MARKS_TOTAL;
  const kind: 'mcq' | 'structured' =
    overrides.kind ?? (p1Shortfall > p2Shortfall ? 'mcq' : 'structured');
  const shape: 'paper' | 'drill' =
    kind === 'mcq' ? 'drill' : (overrides.shape ?? 'paper');

  // 2. Topic: largest deficit vs the paper's blueprint-derived targets.
  const topicTargets: Record<string, number> = {};
  const topicActuals: Record<string, number> = {};
  for (const t of matrix.topics) {
    // A module override narrows the search but never changes how it works: the
    // largest remaining deficit inside the module still wins.
    if (overrides.module && t.module !== overrides.module) continue;
    topicTargets[t.code] = kind === 'mcq' ? t.p1_target : t.p2_marks_target;
    topicActuals[t.code] = kind === 'mcq' ? t.p1_actual : t.p2_marks_actual;
  }
  const topic = overrides.topic_code ?? largestDeficit(topicTargets, topicActuals);
  const row = matrix.topics.find((t) => t.code === topic);
  if (!row) throw new Error(`unknown topic ${topic}`);

  // 3. Difficulty: 25/50/25 target minus actuals for this kind. Settled before
  //    the objectives because it decides how many of them a recipe carries.
  const difficulty =
    overrides.difficulty ??
    (Number(
      largestDeficit(
        DIFFICULTY_TARGETS as unknown as Record<string, number>,
        matrix.difficulty_actuals[kind] as unknown as Record<string, number>,
      ),
    ) as 1 | 2 | 3);

  // 4. Objectives (least-approved first; §4 floors). Chosen before the
  //    representation because coordinate work has to be plotted, and a recipe
  //    field must be derived from its inputs rather than patched afterwards.
  const leastApproved = (code: string) =>
    [...(objectivesByTopic.get(code) ?? [])].sort(
      (a, b) => a.approved - b.approved || (a.id < b.id ? -1 : 1),
    );

  // A paper-shaped question is SINGLE-TOPIC unless the corpus says otherwise.
  //
  // Requiring two or three topics on every question was the pressure that
  // produced stapled parts: where no natural combination existed the model
  // satisfied the requirement by bolting on a part that used earlier answers
  // and demanded nothing. Measured over 104 real questions, 13% pair two topics
  // of one module and the rest carry one, and only six pairs occur at all.
  //
  // So the pairing is a deficit like everything else: pair only where the
  // corpus pairs, and only while we are below the share it shows.
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

  // INTEGRATION, difficulty 3 structured only: one topic, several objectives,
  // chained through one scenario. This is the hardest class the papers set and
  // the one we had none of — our d3 demanded 0.96 distinct skills against the
  // papers' 2.04, no harder than our d1.
  //
  // The three objectives are the three LEAST-APPROVED in the topic, which makes
  // them adjacent ids 66% of the time. That adjacency was suspected of
  // producing thin questions — three neighbouring objectives are often variants
  // of one technique, so "write a percentage, then write it in standard form"
  // declares three objectives and demands barely one. DO NOT re-derive the
  // analysis that followed; it is settled:
  //
  //   Selecting for a wider objective SPAN was refuted by measurement. Span
  //   does not predict integration and the relationship runs backwards if
  //   anything: span 2 averaged 1.26 distinct skills, span 9 averaged 1.00, and
  //   the four widest (span 13) averaged 0.00. The best question in the batch —
  //   simultaneous equations into completing the square into solving the
  //   quadratic — was itself span 2.
  //
  //   Prose skill-counting cannot triage either. It scored that best question 0
  //   and a thin one 1, because our own prompt forbids naming a method, so
  //   "rewrite in the form (t+h)^2+k" never says "completing the square".
  //
  //   Clustering is AUTHENTIC, so span could only ever be a preference. Of the
  //   real questions demanding three or more named skills, 7 spread across
  //   sub-areas and 2 stayed inside one — three transformations on one figure,
  //   averages into cumulative frequency into probability.
  //
  // The known right fix, if generation quality needs raising, is TECHNIQUE
  // GROUPS: encode per topic which objectives are genuinely different
  // techniques, as data, the way NATURAL_PAIRS encodes which topics pair — then
  // pick a group instead of three neighbours. It is deferred on purpose. The
  // trigger is the review of the first 80 integrated d3 questions: if a
  // meaningful share (>25%) is rejected as thin, the grouping is necessary and
  // wants a proper syllabus read, drafted here and confirmed by David, who
  // taught it. If most pass, the thinness was smaller than the prose measure
  // suggested and the work waits until the bank next grows.
  const integrate = integrateWanted(kind, shape, difficulty);

  // Otherwise one objective per topic — the breadth comes from the topics. A
  // drill item stays with its single topic and takes a second objective only
  // where the difficulty asks for one.
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
  //    the visual/prose decision comes FIRST and from the global share, which
  //    is a target rather than a ceiling: as a ceiling it only diverted to
  //    prose once 37% was already exceeded, and it exempted nine of fifteen
  //    topics, so the bank reached 53% visual before anything pushed back.
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
    // Visual or prose is its own deficit against the corpus share. Which
    // visual, when the item is to carry one, still comes from the topic's own
    // table above — that is where "sets get Venn diagrams and statistics get
    // charts" already lives, which is what the old bias list duplicated.
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
  const template_hints =
    repTargets.find((r) => r.representation === representation)?.template_hints ?? [];

  // 6. Archetype: global per-kind targets minus actuals.
  const archetype = largestDeficit(
    (kind === 'mcq' ? MCQ_ARCHETYPE_TARGETS : STRUCTURED_ARCHETYPE_TARGETS) as Record<
      Archetype,
      number
    >,
    matrix.archetype_actuals[kind],
  );


  // Marks follow the settled difficulty and shape.
  const marks =
    kind === 'mcq' ? 1 : shape === 'paper' ? PAPER_MARKS[difficulty] : STRUCTURED_MARKS[difficulty];

  // 7. Profile. Both papers now take it from the same deficit, per module.
  //
  //    Paper 1 used a ten-item cycle keyed to the topic's own count. The cycle
  //    is balanced over ten items and topics hold two to five, so positions
  //    0-4 (CK, AK, AK, R, CK) were all that ever ran and R was structurally
  //    starved. A deficit converges at any topic size.
  //
  //    Paper 2 had no profile at all: the split was the model's to choose and
  //    it chose procedure.
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
    },
    context: { topic_code: topic, topic_codes, template_hints },
  };
}
