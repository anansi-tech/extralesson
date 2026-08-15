import {
  DIFFICULTY_TARGETS,
  nextP1Profile,
  largestDeficit,
  MCQ_ARCHETYPE_TARGETS,
  P1_TOTAL,
  P2_TOTAL,
  REPRESENTATION_TARGETS,
  STRUCTURED_ARCHETYPE_TARGETS,
  type Matrix,
} from '@/lib/targets/matrix';
import {
  MCQ_VISUAL_BIAS_TOPICS,
  MCQ_VISUAL_SHARE,
  type RepresentationTarget,
} from '@/lib/targets/representation';
import type { Archetype, Profile, Representation, TemplateName } from '@/lib/types';

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
}

// Extra context the prompt needs that is derived from the recipe (not part of
// the six fields): which templates fit the representation for this topic.
export interface RecipeContext {
  topic_code: string;
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
}

export function nextRecipe(
  matrix: Matrix,
  objectivesByTopic: Map<string, ObjectiveCoverage[]>,
  overrides: RecipeOverrides = {},
): { recipe: QuestionRecipe; context: RecipeContext } {
  // 1. Paper: larger proportional shortfall wins (tie → P2, the bigger bank).
  const p1Shortfall = (P1_TOTAL - matrix.p1_actual_total) / P1_TOTAL;
  const p2Shortfall = (P2_TOTAL - matrix.p2_actual_total) / P2_TOTAL;
  const kind: 'mcq' | 'structured' =
    overrides.kind ?? (p1Shortfall > p2Shortfall ? 'mcq' : 'structured');

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

  // 3. Representation: topic targets minus topic actuals. For MCQs, respect
  //    the global 37% visual share: unbiased topics only get prose recipes
  //    once the global visual share is exceeded.
  const repTargets: RepresentationTarget[] = REPRESENTATION_TARGETS[topic] ?? [
    { representation: 'prose', share: 100, template_hints: [] },
  ];
  const repTargetRecord: Record<string, number> = {};
  for (const r of repTargets) repTargetRecord[r.representation] = r.share;
  let representation = largestDeficit(
    repTargetRecord,
    row.representation_actuals as Record<string, number>,
  ) as Representation;
  if (kind === 'mcq' && representation !== 'prose') {
    const visualShare =
      matrix.p1_actual_total === 0 ? 0 : matrix.mcq_visual_actual / matrix.p1_actual_total;
    if (visualShare >= MCQ_VISUAL_SHARE && !MCQ_VISUAL_BIAS_TOPICS.has(topic)) {
      representation = 'prose';
    }
  }
  const template_hints =
    repTargets.find((r) => r.representation === representation)?.template_hints ?? [];

  // 4. Archetype: global per-kind targets minus actuals.
  const archetype = largestDeficit(
    (kind === 'mcq' ? MCQ_ARCHETYPE_TARGETS : STRUCTURED_ARCHETYPE_TARGETS) as Record<
      Archetype,
      number
    >,
    matrix.archetype_actuals[kind],
  );

  // 5. Difficulty: 25/50/25 target minus actuals for this kind.
  const difficulty =
    overrides.difficulty ??
    (Number(
      largestDeficit(
        DIFFICULTY_TARGETS as unknown as Record<string, number>,
        matrix.difficulty_actuals[kind] as unknown as Record<string, number>,
      ),
    ) as 1 | 2 | 3);

  // 6. Marks and objectives (least-approved first; §4 floors).
  const marks = kind === 'mcq' ? 1 : STRUCTURED_MARKS[difficulty];
  const objectives = [...(objectivesByTopic.get(topic) ?? [])].sort(
    (a, b) => a.approved - b.approved || (a.id < b.id ? -1 : 1),
  );
  const objective_ids = objectives.slice(0, kind === 'structured' && difficulty >= 2 ? 2 : 1).map((o) => o.id);
  if (objective_ids.length === 0) {
    throw new Error(`no objectives known for topic ${topic}`);
  }

  // 7. Paper 1 profile: position in this topic's block (§B5).
  const profile = kind === 'mcq' ? nextP1Profile(row.p1_actual) : undefined;

  return {
    recipe: { objective_ids, kind, difficulty, marks, archetype, representation, profile },
    context: { topic_code: topic, template_hints },
  };
}
