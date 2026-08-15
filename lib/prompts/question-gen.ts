import type { Objective, QuestionKind } from '@/lib/types';
import type { QuestionRecipe, RecipeContext } from '@/lib/generation/recipe';
import { exemplarsFor } from './exemplars';

// Generation prompts (R1.5 §5): recipe + style spec Part A + 2 module-matched
// exemplars + visual-template contract. Bump PROMPT_VERSION on any wording
// change — it is recorded in gen_meta.prompt_version on every insert.
export const PROMPT_VERSION = 'v8';

// ---- Style spec Part A ----
// Carried from the fingerprint branch's calibrated pilot language (the
// archetype contracts and cognitive-demand controls that passed the second
// blind pilot). The corpus-derived composition targets live in the matrices,
// not in prose.

const ARCHETYPE_CONTRACTS: Record<QuestionRecipe['archetype'], string> = {
  'direct-procedure':
    'The student must carry out one familiar algorithm or calculation; merely reading an input from a visual does not change this label.',
  interpretation:
    'The central demand must be extracting mathematical meaning, a relationship, or a conclusion from a representation—not merely reading values before routine calculation.',
  'multi-step-application':
    'The student must combine at least two dependent procedures or decisions; an explicit proof is not the central demand.',
  comparison:
    'The student must evaluate at least two objects, methods, cases, or conditions against a mathematical criterion.',
  justification:
    'The student must explain, prove, show why, or support a conclusion; a final value alone cannot earn all marks.',
  'reverse-reasoning':
    'The student must infer an unknown input, cause, rule, or property from a supplied result or condition.',
  'complete-the-table':
    'The student must extend a pattern or relation into missing table entries, then use the completed table; pair the question with a patternFigure or dataTable visual.',
};

function demandRequirements(recipe: QuestionRecipe): string {
  if (recipe.difficulty === 1) {
    return `DIFFICULTY-1 DEMAND (hard requirement):
- Assess one familiar recognition, interpretation, or routine procedure.
- The solution should need one principal mathematical move. Do not add artificial wording or irrelevant data.`;
  }
  if (recipe.difficulty === 2 && recipe.kind === 'mcq') {
    return `DIFFICULTY-2 MCQ DEMAND (hard requirement):
- The correct option must require at least TWO DEPENDENT mathematical moves, or interpretation followed by a calculation/classification that uses the interpreted result.
- The answer must not be readable directly from the stem, visual, table, labels, or a single definition.
- A visual must contribute information that the stem does not simply repeat.`;
  }
  if (recipe.difficulty === 2) {
    return `DIFFICULTY-2 STRUCTURED DEMAND (hard requirement):
- Require at least TWO DEPENDENT operations or decisions across the parts.
- A later part must use an earlier result or integrate a real constraint such as packaging, scale, units, or interpretation.
- Reasoning marks must reward an actual decision or translation, not routine arithmetic relabelled as reasoning.`;
  }
  if (recipe.kind === 'mcq') {
    return `DIFFICULTY-3 MCQ DEMAND (hard requirement):
- Require at least TWO syllabus concepts and THREE DEPENDENT reasoning moves.
- Use reverse reasoning, comparison of conditions, or a non-obvious constraint; recognition or direct substitution is not sufficient.
- Every option must require carrying the reasoning far enough to distinguish it. Difficulty must come from mathematics, not wording.`;
  }
  return `DIFFICULTY-3 STRUCTURED DEMAND (hard requirement):
- Require synthesis of at least TWO syllabus concepts across THREE DEPENDENT stages.
- Include a genuine justification, reverse-reasoning step, or decision under a non-obvious constraint.
- Reasoning marks must reward conclusions supported by prior results. Difficulty must come from mathematics, not extra prose or arithmetic volume.`;
}

export function buildDraftPrompt(args: {
  topicTitle: string;
  objectives: Objective[];
  recipe: QuestionRecipe;
  context: RecipeContext;
  module: 1 | 2 | 3;
  /** Per-template params documentation from lib/visuals (empty for prose). */
  visualContract: string;
}): string {
  const { topicTitle, objectives, recipe, context, module, visualContract } = args;
  const kind = recipe.kind;
  const objectiveBlock = objectives
    .map((o) => `- ${o.id}: ${o.text}${o.notes ? `\n  Notes: ${o.notes}` : ''}`)
    .join('\n');

  const visualSection =
    recipe.representation === 'prose'
      ? 'VISUAL: none. Set "visual" to null and "representation" to "prose".'
      : `VISUAL (hard requirement): representation "${recipe.representation}". Emit "visual" as {"template": <name>, "params": <object>} using ONE of these templates: ${context.template_hints.join(', ')}.
${visualContract}
- The stem or stimulus must explicitly refer to the visual.
- Every value shown in the visual must be consistent with the question's mathematics — the params are numerically cross-checked and any inconsistency auto-rejects the draft.
- Values the student must READ from a chart/table live only in the visual; values GIVEN in prose (angles, lengths) must appear in both the text and the visual, identically.
- Labels inside visual params are plain display text: "U", "PQ", "90°" — never "$U$" or KaTeX commands.
- Never emit SVG, HTML, drawing instructions, or coordinates outside the template params.`;

  const partsSection =
    kind === 'mcq'
      ? 'PARTS: exactly one part, label "a", marks 1, whose "answer" is the correct option text.'
      : `PARTS (hard requirement): ${partCountGuidance(recipe.marks)} flat parts labeled "a", "b", ... (never (i)/(ii) nesting). Part marks sum to ${recipe.marks}. Each part's "answer" contains ONLY that part's final value (values-only convention). Later parts build on earlier results where natural. "final_answer" must be the parts' answers joined with "; ".
- When a part asks the student to NAME, STATE, or CLASSIFY something, "answer" must be the standard syllabus term, and every other wording an examiner would accept goes in that part's "accept" array (a mark scheme's "accept:" list — e.g. answer "edge", accept ["line segment where two faces meet"]). Omit "accept" for numeric/algebraic answers unless a genuinely different correct form exists.`;

  return `You are writing an original practice question for CSEC Mathematics (CXC 05/G/SYLL 16, 2027 syllabus) in the style of ${kind === 'mcq' ? 'Paper 1 (multiple choice)' : 'Paper 2 (structured response)'}.

TOPIC: ${topicTitle}
SYLLABUS OBJECTIVES to assess (use exactly these ids in objective_ids):
${objectiveBlock}

QUESTION RECIPE (follow every field exactly):
- kind: ${kind}
- difficulty: ${recipe.difficulty} of 3
- marks: ${recipe.marks}
- archetype: ${recipe.archetype}
- representation: ${recipe.representation}

ARCHETYPE CONTRACT (hard requirement): ${ARCHETYPE_CONTRACTS[recipe.archetype]}

${demandRequirements(recipe)}

MARK PROFILES (official CXC): every mark is CK (Conceptual Knowledge — recalling/recognising concepts), AK (Algorithmic Knowledge — carrying out procedures), or R (Reasoning — translating, justifying, multi-step problem solving). Aim for a sensible CK/AK/R blend for the difficulty; rubric codes are CK1, AK1, R1... and each rubric row carries the "part_label" it marks.

${partsSection}

${visualSection}

RULES:
- The question must be ORIGINAL — written in exam style but never copied, reconstructed, paraphrased, or imitated from any CXC past paper. The recipe contains abstract controls only.
- Use Caribbean contexts naturally where a context is needed (EC dollars, island place names, cricket, market stalls) without being forced.
- An optional "stimulus" carries shared context for the parts; keep the stem short when a stimulus is present.
- Math is KaTeX-safe: inline math in $...$, escape backslashes correctly in JSON. Matrices are notation in stem/parts, never visuals.
- DELIMITER CONVENTION (hard rule, every field): $ is EXCLUSIVELY a math delimiter, in balanced $...$ pairs. Currency is NEVER a bare $ — write EC$ followed by the amount (EC$12) or the word "dollars". Never put EC$ amounts inside $...$ math.
- ${kind === 'mcq'
      ? 'Exactly 4 options. Distractors must each come from a plausible specific error. answer_key is the 0-based index of the correct option. Set "profile" to the single profile the item assesses. marks = 1.'
      : 'Rubric: 2-12 criteria; a criterion may award more than one mark for a substantial linked stage; mark_values sum to marks and each row names its part_label.'}
- misconceptions: 1-3 entries. Each trigger is a specific wrong final answer for one part; name the error; remediation explains the fix in one or two sentences.
- worked_solution: complete, correct, step-by-step for every part, KaTeX-safe. Separate parts with a blank line. Never begin a sentence with a numeral or a bare expression — join steps with words or a colon, so write "Discount $= 15\\%$ of EC$140, so $0.15 \\times 140 = 21$" or "…, giving $0.15 \\times 140 = 21$", NEVER "…of EC$140. $0.15 \\times 140 = 21$" (a full stop followed by a decimal reads as one mangled number).

EXEMPLARS (style and JSON shape only — do not reuse their content):
${exemplarsFor(module, kind)}

Return the question as JSON matching the exemplar shape.`;
}

function partCountGuidance(marks: number): string {
  // Corpus part-count fingerprint: median 4 parts, a third at 5-6 (§4).
  if (marks <= 5) return '2-3';
  if (marks <= 7) return '3-4';
  return '4-6';
}

// Independent solve pass (§5): fresh call; sees stimulus + stem + part
// prompts + a TEXT rendering of the visual params — never SVG, never the
// draft's answers.
export function buildSolvePrompt(args: {
  stimulus?: string;
  stem: string;
  kind: QuestionKind;
  options?: string[];
  partPrompts?: { label: string; prompt: string }[];
  visualText?: string;
}): string {
  const visual = args.visualText ? `\nTHE QUESTION'S VISUAL, AS DATA:\n${args.visualText}\n` : '';
  const stimulus = args.stimulus ? `${args.stimulus}\n\n` : '';
  if (args.kind === 'mcq') {
    return `Solve this CSEC Mathematics multiple-choice question. Work it out independently, then pick the correct option.

${stimulus}${args.stem}
${visual}
Options:
${args.options!.map((o, i) => `${i}: ${o}`).join('\n')}

Return JSON: {"answer_index": <0-based index of the correct option>, "final_answer": "<your computed answer>"}`;
  }
  const parts = (args.partPrompts ?? [])
    .map((p) => `(${p.label}) ${p.prompt}`)
    .join('\n');
  return `Solve this CSEC Mathematics question independently and completely.

${stimulus}${args.stem}
${visual}
PARTS:
${parts}

Return JSON: {"part_answers": [{"label": "a", "final_answer": "..."}, ...]} — one entry per part, in order. Each final_answer contains ONLY that part's final value(s) — no working, no equation setup, no explanations, no sentences. Examples: "42.5" · "x = -1/3; x = 2" · "EC$70".`;
}
