import type { Objective, QuestionKind } from '@/lib/types';
import type { QuestionRecipe, RecipeContext } from '@/lib/generation/recipe';
import { exemplarsFor } from './exemplars';
import { MARK_SCHEME_CONVENTIONS } from './mark-scheme';
import { constructFamily } from '@/lib/targets/construct';
import { misconceptionGuidance } from '@/lib/misconceptions';
import { contextGuidance } from '@/lib/generation/contexts';
import { flavourGuidance } from '@/lib/generation/territories';

// Generation prompts (R1.5 §5): recipe + style spec Part A + 2 module-matched
// exemplars + visual-template contract. Bump PROMPT_VERSION on any wording
// change — it is recorded in gen_meta.prompt_version on every insert — and on
// any change to what a draft is contracted to RETURN (lib/generation/draft-schema.ts),
// since that is what makes older drafts unlike newer ones.
export const PROMPT_VERSION = 'v47';

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
- CHAINING is structural, not verbal. A later slot must USE an earlier slot's result, and you record that in its "depends_on" — but write the instruction the way the papers write it, which is WITHOUT announcing it. Measured across six papers and the 2027 specimen, "hence" appears once or twice in an ENTIRE paper: a part simply asks for the next thing, and the candidate sees that the previous answer is what it needs. Reserve "Hence, or otherwise" for at most one part in a question, and only where the alternative route is genuinely worth offering. Wherever a slot depends on an earlier one, its rubric must allow follow-through: award correct method applied to the student's own earlier value, not only to ours.
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
  /**
   * dataTable's params documentation, supplied only when this question's
   * figure is one the STUDENT DRAWS — see the STIMULUS TABLE section.
   */
  stimulusTableContract?: string;
  /** Stems already in the bank for this topic, so the model can avoid them. */
  existingStems?: string[];
  /** Recent questions on this topic, for the setting ledger (R1.8 Part 0). */
  recentContexts?: { context_category?: string }[];
  /** True when this Paper 1 item should be bare symbolic work. */
  contextFree?: boolean;
  /** The setting this topic is furthest short of, or null for no steer. */
  wantContext?: string | null;
  /** The one name this question may use, or null for none. */
  wantName?: string | null;
}): string {
  const { topicTitle, objectives, recipe, context, module, visualContract } = args;
  // The dedup gate rejects a repeat only after we have paid to generate it, and
  // it cannot see monotony that stops short of near-identical wording: one
  // batch came back with four isosceles-triangle-and-symmetry questions that
  // differed only in the apex angle. Showing the model the bank is the cheaper
  // half of the job.
  //
  // 200 characters rather than 140, because each entry now leads with the
  // stimulus and the identifying mathematics — the function, the sequence, the
  // figure — sits inside the first sentence or two of it.
  const existing = (args.existingStems ?? []).filter((s) => s.trim().length > 0);
  const bankSection = existing.length
    ? `ALREADY IN THE BANK for this topic — write something a student would not mistake for any of these. Change the figure or context, and change what is being asked, not just the numbers or the letters:
${existing.map((s) => `- ${s.replace(/\s+/g, ' ').slice(0, 200)}`).join('\n')}`
    : '';
  const patterns = paperPatterns(recipe, context, objectives);
  const documentedErrors = misconceptionGuidance(recipe.objective_ids);
  const setting = contextGuidance(args.recentContexts ?? [], args.contextFree ?? false, args.wantContext);
  // Seeded by the objectives, so two questions on different objectives are not
  // offered the same six livelihoods to choose from.
  const territory = args.contextFree
    ? ''
    : flavourGuidance(args.existingStems ?? [], undefined, recipe.objective_ids.join(','), args.wantName);
  const kind = recipe.kind;
  const objectiveBlock = objectives
    .map((o) => `- ${o.id}: ${o.text}${o.notes ? `\n  Notes: ${o.notes}` : ''}`)
    .join('\n');

  // A figure the student DRAWS is withheld from them (figureGivesAnswer), so
  // the data it is drawn FROM has to arrive some other way. Six questions
  // reached the bank with it set as a KaTeX array in the stimulus prose, which
  // cannot reflow: on a phone the last class interval sat off the paper.
  const stimulusTableSection = args.stimulusTableContract
    ? `STIMULUS TABLE (hard requirement): the figure above is one the STUDENT DRAWS, so it is withheld from them and the data it is drawn from must be GIVEN separately. Emit "stimulus_table" as dataTable params — the same contract as the template — and never as a table in the stimulus prose.
${args.stimulusTableContract}
- LAY IT OUT DOWN THE PAGE: one row per class or category, the quantities as columns ("Waiting time, t (minutes)" | "Frequency"). Not across the page with a column per class. A table read downwards fits a phone, a desktop and a printed sheet; one laid across does not, and every other table in the bank is built this way.
- The stimulus prose introduces the data in words and does not repeat the table in text.`
    : '';

  const visualSection =
    recipe.representation === 'prose'
      ? 'VISUAL: none. Set "visual" to null and "representation" to "prose".'
      : `VISUAL (hard requirement): representation "${recipe.representation}". Emit "visual" as {"template": <name>, "params": <object>} using ONE of these templates: ${context.template_hints.join(', ')}.
${visualContract}
- The stem or stimulus must explicitly refer to the figure, IN THE WORDS A STUDENT WOULD USE — "the graph", "the table", "the diagram", "the grid above". Never write "the visual": that is our internal word for the figure and it means nothing to a sixteen-year-old reading the paper. Never explain what the figure is FOR either — no "the visual is a model of the curve required in part (a)", no "use it to check your answer". The paper prints a figure and the question refers to it; it does not narrate our marking arrangements.
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
- NEVER NAME THE METHOD. Write "Calculate the distance AC", not "Use the cosine rule to calculate AC"; "Determine the number of terms", not "Use the formula for the sum of an arithmetic series". Across every paper measured, the method is named ZERO times — choosing it IS the assessment, and naming it hands the student the mark you meant to test.
- "rubric_codes" on a slot lists the rubric rows that slot earns, and every rubric row carries "slot_ref" as "part.slot" (for example "a.ii").
- A part may instead be a STATEMENT THE STUDENT COMPLETES IN PLACE: set "statement" to the sentence with {} where each answer goes, one gap per slot in order, and keep the part's prompt as the instruction ("Complete the statement below."). The papers set this repeatedly — "The regular octagon has {} lines of symmetry and rotational symmetry of order {}." — and it is ONE item rather than the two questions it would otherwise split into, because reading the sentence whole is part of the work. Use it where the answers belong to one statement; do not use it as a way to bundle unrelated asks.
- "depends_on" on a slot lists the EARLIER slot refs whose results it uses — ["a.i"], or [] when it needs nothing before it. A real Paper 2 question is a chain: something the candidate can do immediately, then a second thing that needs the first, then a third that needs the second. Aim for a chain at least THREE slots long in a paper-shaped question. Every ref must be a slot of this question that comes before the one declaring it.
- THE OPENING PART MUST DEMAND A STEP, however small (hard requirement). Opening small is right — 30% of real questions open with a single mark — but not one of them opens by copying. Measured across the papers, a 1-mark opening asks the candidate to EVALUATE (73.18 - 5.23 x 9.34), FACTORISE (1 - 4h^2), SUBSTITUTE (the value of f(1)), APPLY A DEFINITION to given data (the lower class boundary of the class 21-30, the upper class limit of 20-39), FORM a relationship (an equation connecting P and V; an inequality for "must not spend more than \$1 200"), or DEDUCE (a value of x that cannot be in the domain).
  What none of them does is restate the stem in another notation. Do NOT open by asking for a column vector whose components are the coordinates the stem just gave, a value the stimulus states, or a total the table already prints. Give the position vectors and ask for $\\overrightarrow{AB}$; give the diagram and ask for a vector read from it; give the table and ask for a value that must be selected or computed rather than copied. The entry step is a step.
- EVERY PART MUST DEMAND WORK THAT HAS NOT ALREADY BEEN DONE (hard requirement). A part earns its marks only if answering it requires something not stated in the stem and not already performed in an earlier part. Two failures to check for by name, because they pass every structural check:
  · A part whose answer is the premise restated. If the stem says "$M$ is the midpoint of $AB$", then "state $\\vec{AM}$ in terms of $\\vec{AB}$" asks the candidate to repeat what they were told.
  · A part that is an earlier part's calculation inverted or rearranged. If (a) computed $\\vec{PQ}$ from $\\vec{OP}$ and $\\vec{OQ}$, then a later part recovering $\\vec{OQ}$ from $\\vec{OP}$ and $\\vec{PQ}$ establishes no new fact — its rubric is (a)'s rubric backwards.
  A part may DEPEND on an earlier result — that is the chain, and it is wanted — but it must go somewhere with it.
- WHERE THE WORK COMES FROM, using vectors as the worked case: the stem gives a setup (a figure, position vectors, a point dividing a line in a stated ratio) and the parts derive properties the setup does NOT state — express a third vector in terms of the given two, show two vectors are parallel and hence that a quadrilateral is a parallelogram, show three points are collinear, find the ratio in which a point divides a segment, find the magnitude of a vector the candidate has just derived rather than one they were given. Every one of those requires a step the stem did not supply. Apply the same test in every topic.
- EVERY PART'S MATHEMATICS BELONGS TO ITS DECLARED OBJECTIVE'S MODULE (hard requirement). This question is tagged Module ${module}, and a slot naming one of the objectives above must be answerable with the content of THAT objective. Difficulty comes from chaining the objectives you were given; it never comes from importing a technique from elsewhere in the syllabus to make the question feel harder. THE RULE RUNS BOTH WAYS, and two pairs are worth naming because both have already reached review. Composite and inverse function notation — $fg(x)$, $gf(2)$, $f(g(x))$, $f^{-1}(x)$ — is Module 2 content, and must not appear anywhere in a question tagged Module 3. The sine and cosine rules are Module 3 content, and must not appear anywhere in a question tagged Module 2: Module 2 trigonometry is the right-angled ratios and Pythagoras, so a Module 2 triangle problem has a right angle in it, and a triangle that needs $\\frac{a}{\\sin A}=\\frac{b}{\\sin B}$ or $a^2=b^2+c^2-2bc\\cos A$ belongs to Module 3. In either direction the candidate may never have met the method, so the part is unanswerable for the student it was written for, whatever the mark scheme says.
- A REGION DEFINED BY INEQUALITIES STATES ITS NON-NEGATIVITY CONSTRAINTS. When the unknowns count things that cannot be negative — items made, hours worked, crates loaded, trips scheduled — $x \\ge 0$ and $y \\ge 0$ are constraints OF THE MODEL and belong in the list with the others, in the wording, in the answer, and in the rubric. Leaving them implied by which corner of the grid you happened to shade makes the region wrong as written, and makes a student who states them look like they added something.
${
        recipe.show_that
          ? `- ONE PART OF THIS QUESTION IS A "SHOW THAT" (hard requirement). The papers state a result and give the marks for reaching it — "Show that the area of the plot is $48\\,\\text{m}^2$", "Show that $x = 4$ satisfies the equation", "Prove that triangle $ABC$ is isosceles" — and the candidate's job is the working, not the value. Put it where the question has earned it: after a part that produced something to work with, and before a part that uses the stated result, so a candidate who cannot derive it can still carry on with it.
- ITS SLOT CARRIES "response_mode": "show_that", and its "answer" is the DERIVATION in one or two lines — the route, not the value the stem already printed. The student marks it themselves against that, so it is the whole of what they check against.
- THE RESULT MUST ACTUALLY FOLLOW, exactly, from what the question has given. A "show that" whose number is a rounding away from the truth teaches a candidate to fudge, and the papers choose their numbers so it comes out clean.
`
          : ''
      }${
        recipe.construct
          ? `- CONSTRUCTION (hard requirement for this question): part (a) asks the student to DRAW, on graph paper, exactly what the figure you emit shows. For the template you choose, that means: ${context.template_hints
              .map((t) => constructFamily(t)?.demand)
              .filter(Boolean)
              .join('; or ')} — "Using a scale of 2 cm to represent 1 unit on both axes, draw the graph of ..." — and its slot carries "response_mode": "construct". State the scale and the domain, as the papers do. There is ONE such slot and it is part (a).
- THE REST OF THE QUESTION INTERROGATES THE DRAWING, and those parts are ordinary "answer" slots we mark: state the roots, the value where the curve cuts the $y$-axis, the coordinates of the minimum, the equation of the axis of symmetry; draw a stated straight line on the same axes and use the intersections to solve the pair. At least two such parts follow.
- EVERY ONE OF THOSE ANSWERS MUST FOLLOW FROM THE EQUATION OR THE DATA, exactly, and be the value the algebra gives — never a value that only a reading off a drawing would produce. We check them against the equation, and a student who draws accurately will read the same thing. Choose the numbers so the reads are exact: roots and intercepts at integers, a turning point at a half-integer at worst.
- THE STUDENT CANNOT SEE THE FIGURE WHILE THEY ANSWER, so nothing may refer to it as shown. The figure you emit is the MODEL ANSWER to part (a): it is withheld until they have committed their reads, then displayed for them to check their drawing against. So no "the graph below shows", no "use the grid provided", no "as shown on the diagram" — the question must read as it would on a blank page, because that is the page the student has. The exception is a pattern of figures, where the figures you emit are the ones GIVEN and the one drawn is the next; there the diagram is shown and may be referred to.
- THE CONSTRUCTION CARRIES ITS MARKS as the papers award them — the scale, the points plotted, the smooth curve — written as ordinary rubric rows against its slot. Like a "show that" or an "explain", the student marks it themselves against the figure we display, so those marks stay out of their estimate; the rows still say what an examiner would credit. Its "answer" states in ONE line what the finished drawing shows, because that line is displayed beside the figure.
`
          : ''
      }${
        recipe.integrate
          ? `- INTEGRATION (hard requirement for this question): ONE scenario, ONE topic, and the objectives above chained through it — not ${recipe.objective_ids.length} questions under one number. This is the hardest class the papers set, and what it looks like: several circle theorems applied in turn to the same figure, each with its reason; a bearings problem where the cosine rule gives a length and the sine rule then gives an angle; a vector question where a ratio gives a point, the point gives a vector, and the vector proves two lines parallel; a transformation described, applied, then combined with a second one. Each part draws on a DIFFERENT one of the objectives, and the later parts use what the earlier ones produced.
- EVERY SLOT NAMES THE OBJECTIVE IT ASSESSES in "objective_id", using one of the ids above. Between them the slots must cover every objective listed — that is what makes this question integrated rather than merely long.
`
          : ''
      }- REQUIRED RUBRIC SPLIT (hard requirement): ${recipe.rubric_split ? `this question's rubric must award EXACTLY ${recipe.rubric_split.CK} CK mark(s), ${recipe.rubric_split.AK} AK mark(s) and ${recipe.rubric_split.R} R mark(s)` : 'as the recipe states'}. These are the profiles the examiner uses, and a real scheme spends about a third of its marks on CK. CK marks attach to SHORT CONCEPTUAL ACTS inside the working, not to a separate easy part: defining a suitable unknown ("let the number of adults be $x$"), stating the relationship or formula that applies before using it, naming the property or theorem being relied on, recognising the structure (that a figure is composite, that two triangles are similar, that a total is shared in a ratio). Award them where the candidate shows they know WHAT to do; award AK where they carry it out; award R where they justify, compare, decide, or reason back from a result.
- A PART WITH MORE THAN ONE ANSWER BOX MUST SAY WHAT EACH BOX IS FOR (hard requirement). The label is a key; the wording the student reads is the slot's "prompt". If (b) asks for two things, each slot carries its own prompt naming ITS quantity — "the gradient", "the $y$-intercept", "the coordinates of $Q$" — never one instruction covering both with the boxes left to be told apart by their order. A slot whose LABEL already names the quantity — "centre", "factor", "modal_class" — is doing the same job and needs no prompt; a slot labelled "i" or "ii" is not. The single exception is a statement completed in place, where each gap sits in the prose that names it.
- ONE RUBRIC ROW PER MARK. A mark scheme credits one act per mark, so a 3-mark part carries three rows, each naming a different creditable act, not one row worth 3. A row worth several marks cannot give a student partial credit for the steps they did get right.
- Every SLOT carries "response_mode": "answer" when the student types a final value, "show_that" when the stem states the result and the slot asks for the derivation, or "explain" when it asks for a reason or justification. A part may mix them: a computed value in one slot and the reason for it in the next. ${recipe.construct ? '"construct" is required on this question and on no other slot — see the CONSTRUCTION contract below.' : 'Never "construct" — we do not set drawing, plotting, or ruler-and-compasses work.'} Whichever mode you choose, "answer" still holds the value or the reason, because the mark scheme is built from it.
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
${
        context.topic_codes.length > 1
          ? `- Its objectives span two topics of the same module (listed above), and they are a pairing the real papers actually make — the question must flow through ONE context from one to the other, never staple a part from the second topic onto the end. If the mathematics will not flow, write the whole question on the first topic and ignore the second.`
          : `- It is a SINGLE-TOPIC question, which is what the papers set most of the time. Depth comes from the chain, not from reaching into another topic.`
      }
- Do NOT write separate questions under one number — the later parts must USE what the earlier parts produced, so a student who got part (a) right is genuinely further along in part (b).
- Later parts must USE the earlier ones — record it in "depends_on" and let the rubric award follow-through — but do not signpost it. The papers almost never write "hence"; they ask for the next thing and let the candidate see what it rests on.
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
${stimulusTableSection}
${bankSection ? `\n${bankSection}` : ''}
${patterns ? `\n${patterns}` : ''}

FORMULAE SHEET (2027): the paper supplies, and the student may use without recalling: area and circumference of a circle including $C = \\pi d$; area of triangle, trapezium and parallelogram; volume of a prism, cylinder, right pyramid, right circular cone and sphere; curved surface area of a cylinder and a cone; total surface area of a cylinder, cone and sphere; Pythagoras' theorem; the trigonometric ratios, the sine rule and the cosine rule; simple interest and compound interest; the counting formula $n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$; mean, median and the quadratic formula.
- Assume every one of these is in front of the student. NEVER build a question whose difficulty is recalling one of them, and never award a mark for stating one: the marks are for SELECTING the right formula, substituting correctly, and interpreting the result.
- This widens what is fair to ask. Compound interest, spheres and cones, and union counting are computation questions now, not memory questions.

RULES:
- The question must be ORIGINAL — written in exam style but never copied, reconstructed, paraphrased, or imitated from any CXC past paper. The recipe contains abstract controls only.
- Use Caribbean contexts naturally where a context is needed, drawn from across the region rather than one corner of it, and without being forced.
- An optional "stimulus" carries shared context for the parts; keep the stem short when a stimulus is present.
- DELIMITERS, exactly these two and no others: inline maths is $...$ and display maths is \\[ ... \\]. NEVER $$ ... $$ — our renderer splits on single $, so a $$ block leaves a stray delimiter that pairs with the next one and swallows the prose between them as maths. Never \\( ... \\) either. Every $ you open must be closed in the SAME field.
- A CLOZE GAP {} MUST SIT OUTSIDE MATHS. The statement is split at {} before it is typeset, so each piece must be able to stand alone: write "the gradient is {}" or "$n(A \\cap B) =$ {}", never "$n(A \\cap B) = {}$", which leaves both halves with one unmatched $.
- AN ANSWER MAY NOT CONTAIN A SEMICOLON INSIDE MATHS. Answers are split on ";" to separate one value from the next, so a semicolon inside $...$ or inside an array tears the expression in half. Use a comma, or separate the values into their own slots.
- NEVER SET A TABLE AS A KaTeX ARRAY. No \\begin{array} in a stimulus, stem, part or worked solution to lay out data in rows and columns: an array is typeset at a fixed width and cannot reflow, so on a phone it runs off the paper and takes the last column with it. A table is either the visual (dataTable) or, when the visual slot already holds a figure the student draws, "stimulus_table".
- A FIGURE OR TABLE LABEL IS PLAIN TEXT: "Frequency", "Time t (s)", "U", "A". No $ and no commands — labels are drawn into SVG and printed into table headers, neither of which runs KaTeX.
- DELIMITERS, exactly two and no others: inline maths is $...$ and display maths is \\[ ... \\]. NEVER $$ ... $$ — the renderer splits on single $, so a $$ block leaves a stray delimiter that pairs with the next one and swallows the prose between them as maths. Every $ you open must close in the SAME field.
- A CLOZE GAP {} MUST SIT OUTSIDE MATHS. The statement is split at {} before it is typeset, so each piece must stand alone: write \"the gradient is {}\" or \"$n(A \\cap B) =$ {}\", never \"$n(A \\cap B) = {}$\", which leaves both halves with one unmatched $.
- AN ANSWER MAY NOT CONTAIN A SEMICOLON INSIDE MATHS. Answers are split on \";\" to separate one value from the next, so a semicolon inside $...$ or inside an array tears the expression in half. Use a comma, or give each value its own slot.
- NEVER SET A TABLE AS A KaTeX ARRAY. No \\begin{array} in a stimulus, stem, part or worked solution to lay out data in rows and columns: an array is typeset at a fixed width and cannot reflow, so on a phone it runs off the paper and takes the last column with it. A table is either the visual (dataTable) or, when the visual slot already holds a figure the student draws, "stimulus_table".
- A FIGURE OR TABLE LABEL IS PLAIN TEXT: \"Frequency\", \"Time t (s)\", \"U\", \"A\". No $ and no commands — labels are drawn into SVG and printed into table headers, and neither runs KaTeX.
- Math is KaTeX-safe: inline math in $...$ (never \\( ... \\)), and a column vector or matrix already carries its own brackets — never put parentheses around one, escape backslashes correctly in JSON. Matrices are notation in stem/parts, never visuals.
- AN UNDERLINED DIGIT is written \\underline{2} inside maths — $3\\underline{2}01_4$ — and works the same in a stem, a slot statement, a figure label and a table cell. It is not decoration: "state the value of the underlined digit in $3\\underline{2}01_4$" is a place-value question in base 4, and without the underline there is nothing to point at.
- MONEY (hard rule, every field): write it as an ESCAPED dollar sign — \$85, \$1 250, \$17 400 — with NO country prefix. The papers are territory-neutral: sixteen countries sit the same paper, and across every one of them money is a bare dollar sign. Never EC$, J$ or BB$; a prefix belongs only in a question ABOUT currency conversion, where naming the currencies is the point. The escape is what keeps $ free to mean "start of maths": inside $...$ it is a delimiter, everywhere else money is written \$.
- THOUSANDS are grouped with a SPACE, not a comma: 17 400, 1 250, 12 500. The papers do this without exception.
- ${kind === 'mcq'
      ? `Exactly 4 options. answer_key is the 0-based index of the correct option. marks = 1.
- DISTRACTOR FAMILIES: each wrong option comes from a specific error a candidate makes, and where the answer is an EXPRESSION the wrong options must be near-miss FORMS, not merely near-miss values — the right coefficient with the wrong exponent, the right exponent with the wrong coefficient, indices added where they should multiply, a sign carried the wrong way. An option nobody would arrive at teaches nothing and gives the answer away.
- ITEM SHAPES the real Paper 1 uses constantly, beyond direct calculation: a DEFINED OPERATION (state how a*b behaves on two examples, ask what it is in general); a TRUE-STATEMENT item over sets or number properties; a UNIT CONVERSION across a scale that must be applied twice; a CURRENCY CONVERSION; a HIRE-PURCHASE versus cash comparison; asking for a value that CANNOT be in a domain. Reach for these as readily as for a calculation.`
      : `Rubric: 2-12 criteria; a criterion may award more than one mark for a substantial linked stage; mark_values sum to marks and each row names the slot that earns it as "slot_ref": "a.ii".
${MARK_SCHEME_CONVENTIONS}
- Where a part carries an answer_format, the scheme marks the form as its own act: include exactly ONE further row for that part with "for_format": true, normally an R mark of 1, whose criterion names the form ("Expresses 'their' answer in standard form"). The other rows mark the value and the method, so a student with the right number in the wrong form keeps them. THIS IS CHECKED AND THE DRAFT IS REJECTED WITHOUT IT: a format nothing marks costs the candidate nothing and is not a demand. If you do not want to spend a mark on the form, leave answer_format unset.`}
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

Return JSON: {${args.visualText ? '"figure_check": {"verdict": "consistent" | "contradicts" | "under_determined", "note": "<one short sentence; empty when consistent>"}, ' : ''}"part_answers": [{"label": "a", "final_answer": "...", "new_work": true, "new_work_note": "..."${args.visualText ? ', "read_off_figure": false' : ''}}, ...]} — EXACTLY ONE ENTRY PER BRACKETED KEY above, in order, and "label" is that key copied verbatim: "a.ii", not "(a)(ii)" and not "a". A key asking for two things in one line does not exist: every answerable thing has its own key. Unless the part is bracketed otherwise above, each final_answer contains ONLY that part's final value(s) — no working, no equation setup, no explanations, no sentences, and no restatement of the value in another form. Examples: "42.5" · "x = -1/3; x = 2" · "\\$70". Where a part is bracketed as asking for a reason or a stated result, answer in that shape instead, and include the value if the part asks for one as well.

FOR EACH PART, ALSO REPORT "new_work". You have just solved the whole question, so you are the only reader who knows what each part actually cost. Set "new_work": true when answering that part required at least one step you had not already done — a calculation, a deduction, a construction, or reading a value off the figure or table. Set it FALSE when the answer was already available: it is stated in the stem or stimulus and only needs repeating, or it is an earlier part's result restated, or it is an earlier part's calculation run backwards so that no new fact is established. "new_work_note" is one short clause saying which: "computed the gradient from two points", or "stated in the stem". Judge what the part DEMANDS, not how it is worded — a part can look like a question and ask for nothing.${
    args.visualText
      ? `

FOR EACH PART, ALSO REPORT "read_off_figure". Set it TRUE when that part's final answer is simply visible in the figure as described above — a coordinate at a labelled point, the corner of a shaded region, a value the axis or the table already prints — so a candidate could write it down without doing the mathematics the part is asking for. Set it FALSE when the figure supplies inputs but the answer still has to be worked out from them. Judge it against the figure you were given, not against how hard the part sounds.`
      : ''
  }
If a part asks whether something is true (yes/no, agree/disagree, is the claim correct), answer with the verdict word alone — "Yes" or "No" — without the supporting calculation.`;
}
