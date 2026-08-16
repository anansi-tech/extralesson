import type { Objective, QuestionKind } from '@/lib/types';
import type { QuestionRecipe, RecipeContext } from '@/lib/generation/recipe';
import { exemplarsFor } from './exemplars';
import { MARK_SCHEME_CONVENTIONS } from './mark-scheme';
import { misconceptionGuidance } from '@/lib/misconceptions';
import { contextGuidance } from '@/lib/generation/contexts';
import { flavourGuidance } from '@/lib/generation/territories';

// Generation prompts (R1.5 §5): recipe + style spec Part A + 2 module-matched
// exemplars + visual-template contract. Bump PROMPT_VERSION on any wording
// change — it is recorded in gen_meta.prompt_version on every insert — and on
// any change to what a draft is contracted to RETURN (lib/generation/draft-schema.ts),
// since that is what makes older drafts unlike newer ones.
export const PROMPT_VERSION = 'v31';

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

// R1.6 §7 — patterns that recur in every real Paper 2. They are prompt-side
// weighting, not schema: each block is emitted only where it actually applies,
// so a number-theory recipe is not told about function notation.
const RFG_TOPICS = new Set(['M2-RFG1', 'M3-RFG2']);

function paperPatterns(recipe: QuestionRecipe, context: RecipeContext, objectives: Objective[]): string {
  if (recipe.kind === 'mcq') return '';
  const blocks: string[] = [
    `PAPER PATTERNS (use where they fit the mathematics — never as decoration):
- "Hence, or otherwise, ..." chains a later part onto an earlier result and is standard in Paper 2. Where you use it, the rubric must allow follow-through: word the later part's criteria so they award marks for correct method applied to the student's own earlier value, not only to the official one.
- "Give a reason for your answer" is routine on geometry, circle-theorem, and comparison parts. Any part that asks for a reason, an explanation, or a justification carries "response_mode": "explain".`,
  ];

  if (RFG_TOPICS.has(context.topic_code)) {
    blocks.push(`FUNCTION NOTATION (hard requirement for this topic): use the notation the papers use, not $f(x) = \\ldots$ alone. Include the mapping form $f: x \\to \\ldots$, and make at least one part use a composite ($fg(x)$ or $gf(x)$) or the inverse ($f^{-1}(x)$).`);
  }

  const sequenceWork = objectives.some((o) => /sequence|pattern/i.test(`${o.text} ${o.notes ?? ''}`));
  if (sequenceWork) {
    blocks.push(`SEQUENCE/PATTERN SHAPE: the papers run these as draw the next figure -> complete the missing table rows -> give the rule for the nth term -> a reverse or justification part. We do not set drawing work, so START at the table: complete-the-table part(s), then the general rule, then a reverse part (given a term or a total, find n) or a justification part.`);
  }

  return blocks.join('\n\n');
}

// What each profile means at Paper 1 item level (R1.7 §B5).
const PROFILE_DEMAND: Record<string, string> = {
  CK: 'the item must test recognising or recalling a concept, definition, property or convention.',
  AK: 'the item must require carrying out a procedure or computation.',
  R: 'the item must require translating, comparing, justifying or working back from a result.',
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
  /** Stems already in the bank for this topic, so the model can avoid them. */
  existingStems?: string[];
  /** Recent questions on this topic, for the setting ledger (R1.8 Part 0). */
  recentContexts?: { context_category?: string }[];
  /** True when this Paper 1 item should be bare symbolic work. */
  contextFree?: boolean;
}): string {
  const { topicTitle, objectives, recipe, context, module, visualContract } = args;
  // The dedup gate rejects a repeat only after we have paid to generate it, and
  // it cannot see monotony that stops short of near-identical wording: one
  // batch came back with four isosceles-triangle-and-symmetry questions that
  // differed only in the apex angle. Showing the model the bank is the cheaper
  // half of the job.
  const existing = (args.existingStems ?? []).filter((s) => s.trim().length > 0);
  const bankSection = existing.length
    ? `ALREADY IN THE BANK for this topic — write something a student would not mistake for any of these. Change the figure or context, and change what is being asked, not just the numbers or the letters:
${existing.map((s) => `- ${s.replace(/\s+/g, ' ').slice(0, 140)}`).join('\n')}`
    : '';
  const patterns = paperPatterns(recipe, context, objectives);
  const documentedErrors = misconceptionGuidance(recipe.objective_ids);
  const setting = contextGuidance(args.recentContexts ?? [], args.contextFree ?? false);
  const territory = args.contextFree ? '' : flavourGuidance(args.existingStems ?? [], undefined);
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
- COORDINATES ARE STATED ONCE, IN THE QUESTION. If the question names a point — $A(1,1)$, $C' = (6,1)$ — the visual is coordinateGrid with a "named" block that REFERENCES those labels: {"named": {"polygons": [{"points": ["A","B","C"]}, {"points": ["A'","B'","C'"], "dashed": true}]}}. Do not repeat the coordinates in the params and do not set x_range or y_range: the figure is drawn from the question's own values, so it cannot disagree with them. By default it renders as a schematic sketch — no axes, no gridlines, no scale numbers, just the shape and its labels — which is what the papers print unless the question is about reading the grid itself. Set "sketch": false only when the student must read values off the axes. Reference ONLY points whose coordinates the question states: if the student's job is to find the image, the image is not in the figure — drawing it would hand them the answer.
- Every other template places its own points by label order, and can never show a stated position. Use those only for questions that give angles, lengths and relationships.
- Every value shown in the visual must be consistent with the question's mathematics — the params are numerically cross-checked and any inconsistency auto-rejects the draft.
- Values the student must READ from a chart/table live only in the visual; values GIVEN in prose (angles, lengths) must appear in both the text and the visual, identically.
- Labels inside visual params are plain display text: "U", "PQ", "90°" — never "$U$" or KaTeX commands.
- Never emit SVG, HTML, drawing instructions, or coordinates outside the template params.
- A dataTable cell may be ANSWERED rather than printed: write {"slots": ["b.r9W"]} in place of the text, and the student fills it. Add "template" with {} for each gap when the paper scaffolds the working — {"slots": ["b.i1","b.i2","b.i3"], "template": "({} × {}) + {} ="} — which is how a sequence question walks a candidate from the arithmetic to the rule in terms of n. Every slot a cell names must be a slot of one of this question's parts, and a final row in terms of n is written the same way.
${
  recipe.representation === 'graph'
    ? `- This is a GRAPH ON A GRID, and it IS to scale — that is what the grid is for. Reading a value, an intercept, a gradient or a turning point off it is fair and expected, exactly as in the real papers. Do not write "not drawn to scale" on it. Still never ask the student to measure with an instrument.`
    : `- The figure is a LABELLED SKETCH, not a scale drawing — exactly as in the real papers, where diagrams are marked "not drawn to scale". Never describe it as accurately drawn or to scale, and never ask the student to MEASURE a length or an angle from it, or to name the instruments they would use: every value they need must be stated in the text or labelled on the figure.`
}`;

  const partsSection =
    kind === 'mcq'
      ? 'PARTS: exactly one part, label "a", marks 1, whose "answer" is the correct option text.'
      : `PARTS (hard requirement): ${partCountGuidance(recipe.marks, recipe.shape)} lettered parts "a", "b", ... whose marks sum to ${recipe.marks}. A part is ONE INSTRUCTION and the SLOTS it governs, exactly as the papers print it:
  {"label": "a", "prompt": "Factorize, completely, EACH of the following.", "marks": 3,
   "slots": [{"label": "i", "prompt": "$xy^2 - x^2y$", "answer": "xy(y - x)", "rubric_codes": ["AK1"]},
             {"label": "ii", "prompt": "$3x^2 + x - 10$", "answer": "(3x - 5)(x + 2)", "rubric_codes": ["AK2"]}]}
- A part that asks ONE thing has ONE slot labelled "i" and no slot prompt: the part instruction says it all.
- Slot labels are "i", "ii", "iii" for sub-parts as printed, or a descriptive key where the paper asks for several named things at once: "Describe fully the single transformation" becomes slots "type", "centre", "factor", each separately answerable and separately marked.
- Each slot answer contains ONLY that slot final value (values-only convention). Later slots and parts build on earlier results where natural. "final_answer" is every slot answer joined with "; ", in order.
- "rubric_codes" on a slot lists the rubric rows that slot earns, and every rubric row carries "slot_ref" as "part.slot" (for example "a.ii").
- Every SLOT carries "response_mode": "answer" when the student types a final value, "show_that" when the stem states the result and the slot asks for the derivation, or "explain" when it asks for a reason or justification. A part may mix them: a computed value in one slot and the reason for it in the next. Never "construct" — we do not set drawing, plotting, or ruler-and-compasses work. Whichever mode you choose, "answer" still holds the value or the reason, because the mark scheme is built from it.
- Set "answer_format" on a SLOT ONLY when its wording demands a particular form: "exact", "surd" ($a\\sqrt{b}$), "standard_form", "lowest_terms", "integer", "equation_form" (an answer of the form $y = mx + c$), "sf:N" (N significant figures) or "dp:N" (N decimal places). If you write "correct to 2 decimal places" or "in exact form" into a part, that part must carry the matching answer_format; if you do not demand a form, omit the field. Use ONLY the values listed — they are the forms we can mark. If the form you want is not there (set-builder notation, a ratio, a bearing), write the demand into the part's wording, where the student reads it, and leave answer_format unset.
- When a part asks the student to NAME, STATE, CLASSIFY, or JUDGE something (including yes/no verdicts), "answer" must be the shortest standard form — the syllabus term, or the bare verdict word — and every other wording an examiner would accept goes in that part's "accept" array (a mark scheme's "accept:" list — e.g. answer "edge", accept ["line segment where two faces meet"]). Omit "accept" for numeric/algebraic answers unless a genuinely different correct form exists.`;

  // R1.8 §2 — the shape of the thing, stated before the recipe fields, because
  // a model told only "10 marks, 3 parts" writes three unrelated fragments
  // stapled together rather than one question that goes somewhere.
  const shapeSection =
    recipe.shape === 'drill'
      ? ''
      : `QUESTION SHAPE — this is a WHOLE Paper 2 question, not a fragment:
- It is worth ${recipe.marks} marks and it develops. The papers open a question with something a candidate can do immediately, then build on it: a computation that becomes an applied context, a formula rearranged and then used, a figure measured and then reasoned about.
- Its objectives span ${context.topic_codes.length} topics of the same module (listed above). Do NOT write ${context.topic_codes.length} separate questions under one number — the later parts must USE what the earlier parts produced, so a student who got part (a) right is genuinely further along in part (b).
- Where a part follows from an earlier result, say "Hence" or "Hence, or otherwise" exactly as the papers do, and let the rubric award the later part on the student's own earlier value (follow-through) rather than only on ours.
- One shared setting, introduced once in the stimulus, carries the whole question. Do not restart the scenario at every part.

`;

  return `You are writing an original practice question for CSEC Mathematics (CXC 05/G/SYLL 16, 2027 syllabus) in the style of ${kind === 'mcq' ? 'Paper 1 (multiple choice)' : 'Paper 2 (structured response)'}.

${shapeSection}TOPIC: ${topicTitle}
SYLLABUS OBJECTIVES to assess (use exactly these ids in objective_ids):
${objectiveBlock}

QUESTION RECIPE (follow every field exactly):
- kind: ${kind}
- difficulty: ${recipe.difficulty} of 3
- marks: ${recipe.marks}
- archetype: ${recipe.archetype}
- representation: ${recipe.representation}${
    recipe.profile
      ? `\n- profile: ${recipe.profile} — ${PROFILE_DEMAND[recipe.profile]} Set "profile" to exactly this; it is the item's place in a topic block that climbs CK to AK to R, as the real Paper 1 does.`
      : ''
  }

ARCHETYPE CONTRACT (hard requirement): ${ARCHETYPE_CONTRACTS[recipe.archetype]}

${demandRequirements(recipe)}

MARK PROFILES (official CXC): every mark is CK (Conceptual Knowledge — recalling/recognising concepts), AK (Algorithmic Knowledge — carrying out procedures), or R (Reasoning — translating, justifying, multi-step problem solving). Aim for a sensible CK/AK/R blend for the difficulty; rubric codes are CK1, AK1, R1... and each rubric row carries the "part_label" it marks.

${setting}
${territory ? `${territory}
` : ''}
${partsSection}

${visualSection}
${bankSection ? `\n${bankSection}` : ''}
${patterns ? `\n${patterns}` : ''}

FORMULAE SHEET (2027): the paper supplies, and the student may use without recalling: area and circumference of a circle including $C = \\pi d$; area of triangle, trapezium and parallelogram; volume of a prism, cylinder, right pyramid, right circular cone and sphere; curved surface area of a cylinder and a cone; total surface area of a cylinder, cone and sphere; Pythagoras' theorem; the trigonometric ratios, the sine rule and the cosine rule; simple interest and compound interest; the counting formula $n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$; mean, median and the quadratic formula.
- Assume every one of these is in front of the student. NEVER build a question whose difficulty is recalling one of them, and never award a mark for stating one: the marks are for SELECTING the right formula, substituting correctly, and interpreting the result.
- This widens what is fair to ask. Compound interest, spheres and cones, and union counting are computation questions now, not memory questions.

RULES:
- The question must be ORIGINAL — written in exam style but never copied, reconstructed, paraphrased, or imitated from any CXC past paper. The recipe contains abstract controls only.
- Use Caribbean contexts naturally where a context is needed, drawn from across the region rather than one corner of it, and without being forced.
- An optional "stimulus" carries shared context for the parts; keep the stem short when a stimulus is present.
- Math is KaTeX-safe: inline math in $...$ (never \\( ... \\)), and a column vector or matrix already carries its own brackets — never put parentheses around one, escape backslashes correctly in JSON. Matrices are notation in stem/parts, never visuals.
- MONEY (hard rule, every field): write it as an ESCAPED dollar sign — \$85, \$1 250, \$17 400 — with NO country prefix. The papers are territory-neutral: sixteen countries sit the same paper, and across every one of them money is a bare dollar sign. Never EC$, J$ or BB$; a prefix belongs only in a question ABOUT currency conversion, where naming the currencies is the point. The escape is what keeps $ free to mean "start of maths": inside $...$ it is a delimiter, everywhere else money is written \$.
- THOUSANDS are grouped with a SPACE, not a comma: 17 400, 1 250, 12 500. The papers do this without exception.
- ${kind === 'mcq'
      ? `Exactly 4 options. answer_key is the 0-based index of the correct option. marks = 1.
- DISTRACTOR FAMILIES: each wrong option comes from a specific error a candidate makes, and where the answer is an EXPRESSION the wrong options must be near-miss FORMS, not merely near-miss values — the right coefficient with the wrong exponent, the right exponent with the wrong coefficient, indices added where they should multiply, a sign carried the wrong way. An option nobody would arrive at teaches nothing and gives the answer away.
- ITEM SHAPES the real Paper 1 uses constantly, beyond direct calculation: a DEFINED OPERATION (state how a*b behaves on two examples, ask what it is in general); a TRUE-STATEMENT item over sets or number properties; a UNIT CONVERSION across a scale that must be applied twice; a CURRENCY CONVERSION; a HIRE-PURCHASE versus cash comparison; asking for a value that CANNOT be in a domain. Reach for these as readily as for a calculation.`
      : `Rubric: 2-12 criteria; a criterion may award more than one mark for a substantial linked stage; mark_values sum to marks and each row names the slot that earns it as "slot_ref": "a.ii".
${MARK_SCHEME_CONVENTIONS}
- Where a part carries an answer_format, the scheme marks the form as its own act: include exactly ONE further row for that part with "for_format": true, normally an R mark of 1, whose criterion names the form ("Expresses 'their' answer in standard form"). The other rows mark the value and the method, so a student with the right number in the wrong form keeps them.`}
- A SOLUTION SET from a real-world quantity must fix its domain. Say in the question what the variable counts or measures and whether it is a whole number, and write the answer set with that domain: $\\{x \\in \\mathbb{N} : x \\ge 15\\}$ for a count of pairs, $\\{x \\in \\mathbb{R} : 0 \\le x \\le 12\\}$ for a distance. A bare $\\{x : x \\ge 15\\}$ is ambiguous — it claims every real number above 15 is an answer, including 15.4 pairs.
- ACCURACY, as the real papers do it: when a part's answer does not terminate — it comes from trigonometry, a square root, ${'\u03c0'}, or a division that runs on — the part must SAY what accuracy it wants ("correct to 3 significant figures", or "to 1 decimal place" for an angle) and carry the matching answer_format ("sf:3", "dp:1"). When the answer is exact but has more than one accepted written form, say which form you want (exact, surd, standard form, lowest terms, ${'y = mx + c'}) and tag that instead. Never demand an accuracy the mathematics does not need.
- misconceptions: 1-3 entries. Each trigger is a specific wrong final answer for one part; name the error; remediation explains the fix in one or two sentences.
${documentedErrors ? `\n${documentedErrors}\n` : ''}
- worked_solution: complete, correct, step-by-step for every part, KaTeX-safe. Separate parts with a blank line. Never begin a sentence with a numeral or a bare expression — join steps with words or a colon, so write "Discount $= 15\\%$ of \\$140, so $0.15 \\times 140 = 21$" or "…, giving $0.15 \\times 140 = 21$", NEVER "…of \\$140. $0.15 \\times 140 = 21$" (a full stop followed by a decimal reads as one mangled number).

EXEMPLARS (style and JSON shape only — do not reuse their content):
${exemplarsFor(module, kind)}

Return the question as JSON matching the exemplar shape.`;
}

function partCountGuidance(marks: number, shape: 'paper' | 'drill'): string {
  // A paper-shaped question is 2-4 LETTERED parts; the depth the corpus shows
  // lives in the sub-parts under them, which are slots now (R1.8 §2). A drill
  // item keeps the flat fingerprint: median 4 parts, a third at 5-6 (§4).
  if (shape === 'paper') return marks >= 12 ? '3-4' : '2-4';
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
  partPrompts?: { label: string; prompt: string; mode?: string }[];
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
  // Each part says what shape its answer takes. Without this the solver returns
  // a bare value for a part that asked for a reason, and the gate then compares
  // "5" against "five lines, one through each vertex" and calls them different.
  const shape: Record<string, string> = {
    show_that: '  [state the result your working reaches]',
    explain: '  [give the reason, in one short sentence]',
  };
  const figureCheck = args.visualText
    ? `
BEFORE SOLVING, look at the figure as described against the question.
- "contradicts": the figure states something the question denies, or the other way round — a length on the wrong side, a point where the question puts it elsewhere, a shape whose arrangement disagrees with stated coordinates, a value that differs. Say which.
- "under_determined": the figure is missing something the question needs you to read off it, so the parts cannot be answered from what is shown.
- "consistent": neither of those.
Judge only the figure against the words. A figure that is a plain sketch of what the words describe is consistent, even if it adds nothing.
`
    : '';
  const parts = (args.partPrompts ?? [])
    .map((p) => `[${p.label}] ${p.prompt}${shape[p.mode ?? 'answer'] ?? ''}`)
    .join('\n');
  return `Solve this CSEC Mathematics question independently and completely.

${stimulus}${args.stem}
${visual}
PARTS:
${parts}
${figureCheck}

Return JSON: {${args.visualText ? '"figure_check": {"verdict": "consistent" | "contradicts" | "under_determined", "note": "<one short sentence; empty when consistent>"}, ' : ''}"part_answers": [{"label": "a", "final_answer": "..."}, ...]} — EXACTLY ONE ENTRY PER BRACKETED KEY above, in order, and "label" is that key copied verbatim: "a.ii", not "(a)(ii)" and not "a". A key asking for two things in one line does not exist: every answerable thing has its own key. Unless the part is bracketed otherwise above, each final_answer contains ONLY that part's final value(s) — no working, no equation setup, no explanations, no sentences, and no restatement of the value in another form. Examples: "42.5" · "x = -1/3; x = 2" · "\\$70". Where a part is bracketed as asking for a reason or a stated result, answer in that shape instead, and include the value if the part asks for one as well.
If a part asks whether something is true (yes/no, agree/disagree, is the claim correct), answer with the verdict word alone — "Yes" or "No" — without the supporting calculation.`;
}
