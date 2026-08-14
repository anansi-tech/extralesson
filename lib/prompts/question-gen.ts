import type { Objective, QuestionKind } from '@/lib/types';
import type { QuestionRecipe } from '@/lib/generation/question-recipe';
import type { QuestionVisual } from '@/lib/validation/question-visual';

// Generation prompts (ROUND_1 §4). Bump PROMPT_VERSION on any wording change —
// it is recorded in gen_meta.prompt_version on every inserted question.
export const PROMPT_VERSION = 'v6';

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
- Require at least TWO DEPENDENT operations or decisions.
- Include the requested parts, with a later part using an earlier result or integrating a real constraint such as packaging, scale, units, or interpretation.
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

const MCQ_EXEMPLAR = `{
  "kind": "mcq",
  "stem": "A store marks up an item costing EC$80 by 35%. What is the selling price?",
  "options": ["EC$108", "EC$115", "EC$28", "EC$105.33"],
  "answer_key": 0,
  "profile": "AK",
  "difficulty": 1,
  "marks": 1,
  "visual": null,
  "worked_solution": "Markup $= 0.35 \\\\times 80 = 28$. Selling price: $80 + 28 = 108$, so the answer is EC$108.",
  "misconceptions": [
    { "trigger": "EC$28", "name": "Markup instead of price", "remediation": "You found the markup amount. Add it to the cost price: $80 + 28 = 108$, giving EC$108." }
  ]
}`;

const STRUCTURED_EXEMPLAR = `{
  "kind": "structured",
  "stem": "Solve for $x$: $3x^2 - 5x - 2 = 0$. [3 marks]",
  "difficulty": 2,
  "marks": 3,
  "visual": null,
  "rubric": [
    { "code": "CK1", "profile": "CK", "criterion": "Recognises the quadratic can be solved by factorisation (or formula)", "mark_value": 1 },
    { "code": "AK1", "profile": "AK", "criterion": "Correct factorisation $(3x + 1)(x - 2)$ or correct substitution into the formula", "mark_value": 1 },
    { "code": "R1", "profile": "R", "criterion": "Both roots stated: $x = -\\\\frac{1}{3}$ and $x = 2$", "mark_value": 1 }
  ],
  "final_answer": "x = -1/3 or x = 2",
  "worked_solution": "$3x^2 - 5x - 2 = (3x + 1)(x - 2) = 0$, so $3x + 1 = 0 \\\\Rightarrow x = -\\\\frac{1}{3}$, or $x - 2 = 0 \\\\Rightarrow x = 2$.",
  "misconceptions": [
    { "trigger": "x = 1/3", "name": "Sign slip", "remediation": "$3x + 1 = 0$ gives $x = -\\\\frac{1}{3}$, not $+\\\\frac{1}{3}$. Watch the sign when isolating $x$." }
  ]
}`;

export function buildDraftPrompt(args: {
  topicTitle: string;
  objectives: Objective[];
  recipe: QuestionRecipe;
}): string {
  const { topicTitle, objectives, recipe } = args;
  const kind: QuestionKind = recipe.kind;
  const objectiveBlock = objectives
    .map((o) => `- ${o.id}: ${o.text}${o.notes ? `\n  Notes: ${o.notes}` : ''}`)
    .join('\n');
  const profileInstruction =
    recipe.kind === 'mcq'
      ? `PROFILE: ${recipe.profile}. Set the question's profile to exactly this value.`
      : `PROFILE MARKS: CK ${recipe.profile_split.CK}, AK ${recipe.profile_split.AK}, R ${recipe.profile_split.R}. The rubric must award exactly these totals.`;

  return `You are writing an original practice question for CSEC Mathematics (CXC 05/G/SYLL 16, 2027 syllabus) in the style of ${kind === 'mcq' ? 'Paper 1 (multiple choice)' : 'Paper 2 (structured response)'}.

TOPIC: ${topicTitle}
SYLLABUS OBJECTIVES to assess (use exactly these ids in objective_ids):
${objectiveBlock}

QUESTION RECIPE (follow every field exactly):
- Difficulty: ${recipe.difficulty} of 3 (1 = routine single-step, 2 = multi-step, 3 = demanding multi-concept)
- Marks: ${recipe.marks}
- Archetype: ${recipe.archetype}
- Primary command verb: ${recipe.command_verb ?? 'none — use a natural interrogative stem'}
- Parts: ${recipe.part_count}
- Representation: ${recipe.representation}
- Visual type: ${recipe.visual_type ?? 'none'}
- Context category: ${recipe.context_category}
- ${profileInstruction}
- Misconception families to target: ${recipe.misconception_families.length ? recipe.misconception_families.join(', ') : 'choose plausible errors implied by the mathematics'}

MARK PROFILES (official CXC): every mark is CK (Conceptual Knowledge — recalling/recognising concepts), AK (Algorithmic Knowledge — carrying out procedures), or R (Reasoning — translating, justifying, multi-step problem solving).

${demandRequirements(recipe)}

RULES:
- The question must be ORIGINAL — written in exam style but never copied or near-copied from any CXC past paper.
- Do not quote, reconstruct, paraphrase, or imitate a distinctive source question. The recipe contains abstract controls only.
- Use Caribbean contexts naturally where a context is needed (EC dollars, island place names, cricket, market stalls) without being forced.
- Math must be typeset KaTeX-safe: inline math in $...$, escape backslashes correctly in JSON.
- Set visual to null when the recipe visual type is none. Otherwise return a structured visual object whose visual_type exactly matches the recipe. Include every coordinate, label, value, table cell, and relationship required to solve the question. The stem must explicitly refer to the visual. alt_text must describe the display without revealing the answer. For fixed-canvas diagram points, use the full 0–100 layout space: the largest horizontal or vertical span must be at least 35 units. Never return SVG, HTML, a URL, base64, or drawing instructions in prose; only use the typed visual fields allowed by the response schema.
- DELIMITER CONVENTION (hard rule, every field — stem, options, rubric criteria, final_answer, worked_solution, misconception triggers and remediations): the $ sign is EXCLUSIVELY a math delimiter, always in balanced $...$ pairs. Currency is NEVER written with a bare $. Write currency as EC$ immediately followed by the amount (EC$12, EC$3.40) or spell out "dollars". Never put EC$ amounts inside $...$ math.
- ${kind === 'mcq'
      ? 'Exactly 4 options. Distractors must each come from a plausible specific error. answer_key is the 0-based index of the correct option. marks = 1.'
      : 'Write a rubric of 2-12 criteria. Codes are CK1, CK2..., AK1..., R1... matching each criterion\'s profile. A criterion may award more than one mark when it represents a substantial linked stage. mark_values must sum to the recipe marks and match its exact CK/AK/R totals. final_answer must contain ONLY the final value(s) — no sentences, no labels, no working. One value per required part/root, separated by "; ". Examples: "42.5" · "x = -1/3; x = 2" · "EC$70; EC$58".'}
- misconceptions: 1-3 entries. Each trigger is a specific wrong final answer a student might give; name the error; remediation explains the fix in one or two sentences.
- worked_solution: complete, correct, step-by-step, KaTeX-safe.

EXEMPLAR (style and JSON shape only — do not reuse content):
${kind === 'mcq' ? MCQ_EXEMPLAR : STRUCTURED_EXEMPLAR}

Return the question as JSON matching the exemplar's shape.`;
}

// Independent solve pass (§4.3): fresh call, sees the stem only (plus options
// for mcq) — never the draft's solution. Used to auto-reject wrong drafts.
export function buildSolvePrompt(args: {
  stem: string;
  kind: QuestionKind;
  options?: string[];
  visual?: QuestionVisual | null;
}): string {
  const visualBlock = args.visual
    ? `\nMachine-readable visual supplied with the question:\n${JSON.stringify(args.visual)}\n`
    : '';
  if (args.kind === 'mcq') {
    return `Solve this CSEC Mathematics multiple-choice question. Work it out independently, then pick the correct option.

${args.stem}
${visualBlock}

Options:
${args.options!.map((o, i) => `${i}: ${o}`).join('\n')}

Return JSON: {"answer_index": <0-based index of the correct option>, "final_answer": "<your computed answer>"}`;
  }
  return `Solve this CSEC Mathematics question independently and completely.

${args.stem}
${visualBlock}

Return JSON: {"final_answer": "..."} where final_answer contains ONLY the final value(s) — no working, no equation setup, no explanations, no (a)/(b) labels, no sentences. One value per required part/root, separated by "; ". Examples: "42.5" · "x = -1/3; x = 2" · "EC$70; EC$58".`;
}
