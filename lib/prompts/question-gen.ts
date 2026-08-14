import type { Objective, QuestionKind } from '@/lib/types';

// Generation prompts (ROUND_1 §4). Bump PROMPT_VERSION on any wording change —
// it is recorded in gen_meta.prompt_version on every inserted question.
export const PROMPT_VERSION = 'v3';

const MCQ_EXEMPLAR = `{
  "kind": "mcq",
  "stem": "A store marks up an item costing EC$80 by 35%. What is the selling price?",
  "options": ["EC$108", "EC$115", "EC$28", "EC$105.33"],
  "answer_key": 0,
  "profile": "AK",
  "difficulty": 1,
  "marks": 1,
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
  kind: QuestionKind;
  difficulty: 1 | 2 | 3;
}): string {
  const { topicTitle, objectives, kind, difficulty } = args;
  const objectiveBlock = objectives
    .map((o) => `- ${o.id}: ${o.text}${o.notes ? `\n  Notes: ${o.notes}` : ''}`)
    .join('\n');

  return `You are writing an original practice question for CSEC Mathematics (CXC 05/G/SYLL 16, 2027 syllabus) in the style of ${kind === 'mcq' ? 'Paper 1 (multiple choice)' : 'Paper 2 (structured response)'}.

TOPIC: ${topicTitle}
SYLLABUS OBJECTIVES to assess (pick 1-2 and list their ids in objective_ids):
${objectiveBlock}

DIFFICULTY: ${difficulty} of 3 (1 = routine single-step, 2 = multi-step, 3 = demanding multi-concept).

MARK PROFILES (official CXC): every mark is CK (Conceptual Knowledge — recalling/recognising concepts), AK (Algorithmic Knowledge — carrying out procedures), or R (Reasoning — translating, justifying, multi-step problem solving).

RULES:
- The question must be ORIGINAL — written in exam style but never copied or near-copied from any CXC past paper.
- Use Caribbean contexts naturally where a context is needed (EC dollars, island place names, cricket, market stalls) without being forced.
- Math must be typeset KaTeX-safe: inline math in $...$, escape backslashes correctly in JSON.
- DELIMITER CONVENTION (hard rule, every field — stem, options, rubric criteria, final_answer, worked_solution, misconception triggers and remediations): the $ sign is EXCLUSIVELY a math delimiter, always in balanced $...$ pairs. Currency is NEVER written with a bare $. Write currency as EC$ immediately followed by the amount (EC$12, EC$3.40) or spell out "dollars". Never put EC$ amounts inside $...$ math.
- ${kind === 'mcq'
      ? 'Exactly 4 options. Distractors must each come from a plausible specific error. answer_key is the 0-based index of the correct option. Set "profile" to the single profile the item assesses. marks = 1.'
      : 'Write a rubric of 2-6 criteria. Codes are CK1, CK2..., AK1..., R1... matching each criterion\'s profile. mark_values must sum to marks (2-9 marks total). final_answer must contain ONLY the final value(s) — no sentences, no labels, no working. One value per required part/root, separated by "; ". Examples: "42.5" · "x = -1/3; x = 2" · "EC$70; EC$58".'}
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
}): string {
  if (args.kind === 'mcq') {
    return `Solve this CSEC Mathematics multiple-choice question. Work it out independently, then pick the correct option.

${args.stem}

Options:
${args.options!.map((o, i) => `${i}: ${o}`).join('\n')}

Return JSON: {"answer_index": <0-based index of the correct option>, "final_answer": "<your computed answer>"}`;
  }
  return `Solve this CSEC Mathematics question independently and completely.

${args.stem}

Return JSON: {"final_answer": "..."} where final_answer contains ONLY the final value(s) — no working, no equation setup, no explanations, no (a)/(b) labels, no sentences. One value per required part/root, separated by "; ". Examples: "42.5" · "x = -1/3; x = 2" · "EC$70; EC$58".`;
}
