import { describe, expect, it } from 'vitest';
import { buildDraftPrompt, buildSolvePrompt, PROMPT_VERSION } from '@/lib/prompts/question-gen';
import type { QuestionRecipe, RecipeContext } from '@/lib/generation/recipe';
import type { Objective } from '@/lib/types';
import { flavourGuidance, recentActors } from '@/lib/generation/territories';

// R1.6 §7 — the paper patterns must reach the model, and only where they apply:
// a prompt that always says everything teaches the model nothing.

const recipe = (over: Partial<QuestionRecipe> = {}): QuestionRecipe => ({
  objective_ids: ['M2.3.1'],
  kind: 'structured',
  difficulty: 2,
  marks: 7,
  archetype: 'multi-step-application',
  representation: 'prose',
  shape: 'drill',
  ...over,
});

const context = (topic_code: string, topic_codes?: string[]): RecipeContext => ({
  topic_code,
  topic_codes: topic_codes ?? [topic_code],
  template_hints: [],
});

const objective = (text: string): Objective => ({ id: 'M2.3.1', text });

function prompt(args: {
  topic: string;
  objectives?: Objective[];
  recipe?: Partial<QuestionRecipe>;
}): string {
  return buildDraftPrompt({
    topicTitle: 'Test topic',
    objectives: args.objectives ?? [objective('Solve linear equations in one unknown.')],
    recipe: recipe(args.recipe),
    context: context(args.topic),
    module: 2,
    visualContract: '',
  });
}

describe('buildDraftPrompt — R1.6 §7 paper patterns', () => {
  it('is versioned so gen_meta records which wording produced a draft', () => {
    expect(PROMPT_VERSION).toBe('v46');
  });

  // Both caught in review on the same batch: composite-function content tagged
  // with Module 3 objectives under the integration requirement, and feasible
  // regions whose inequalities left x >= 0, y >= 0 implied by the shading.
  it('names the module a part\'s mathematics must belong to, and rules out M2 function notation in M3', () => {
    const p = buildDraftPrompt({
      topicTitle: 'Test topic',
      objectives: [objective('Draw the graph of a linear inequality.')],
      recipe: recipe({ difficulty: 3, integrate: true }),
      context: context('M3-RFG1'),
      module: 3,
      visualContract: '',
    });
    expect(p).toContain('tagged Module 3');
    expect(p).toContain('is Module 2 content');
    expect(p).toContain('must not appear anywhere in a question tagged Module 3');
    // Symmetric: the leak runs both ways, and the reverse reached review too.
    expect(p).toContain('THE RULE RUNS BOTH WAYS');
    expect(p).toContain('must not appear anywhere in a question tagged Module 2');
  });

  it('requires a region of inequalities to state its non-negativity constraints', () => {
    const p = prompt({ topic: 'M3-RFG1' });
    expect(p).toContain('NON-NEGATIVITY CONSTRAINTS');
    expect(p).toContain('constraints OF THE MODEL');
  });

  it('teaches chaining as structure with follow-through, and restrains the signposting', () => {
    const p = prompt({ topic: 'M2-ALG2' });
    expect(p).toContain('depends_on');
    expect(p).toContain('follow-through');
    expect(p).toContain("student's own earlier value");
    // Measured: "hence" appears once or twice in a WHOLE paper, and our bank
    // said it in 72% of questions because this prompt told it to.
    expect(p).toContain('appears once or twice in an ENTIRE paper');
  });

  it('forbids naming the method, which the papers never do', () => {
    const p = prompt({ topic: 'M2-GEO1' });
    expect(p).toContain('NEVER NAME THE METHOD');
    expect(p).toContain('choosing it IS the assessment');
  });

  it('asks for one rubric row per mark, as a mark scheme credits one act per mark', () => {
    expect(prompt({ topic: 'M2-ALG2' })).toContain('ONE RUBRIC ROW PER MARK');
  });

  it('pairs a request for a reason with response_mode explain', () => {
    expect(prompt({ topic: 'M2-ALG2' })).toContain('"response_mode": "explain"');
  });

  it('demands exam function notation on the functions topics only', () => {
    for (const topic of ['M2-RFG1', 'M3-RFG2']) {
      expect(prompt({ topic })).toContain('FUNCTION NOTATION');
    }
    expect(prompt({ topic: 'M1-NTC' })).not.toContain('FUNCTION NOTATION');
  });

  it('shapes sequence questions around the table and rule, never the drawing', () => {
    const p = prompt({
      topic: 'M1-ALG1',
      objectives: [objective('Derive an appropriate rule given the terms of a sequence.')],
    });
    expect(p).toContain('SEQUENCE/PATTERN SHAPE');
    expect(p).toContain('We do not set drawing work');
    expect(prompt({ topic: 'M1-ALG1' })).not.toContain('SEQUENCE/PATTERN SHAPE');
  });

  it('keeps every pattern out of single-mark MCQ prompts', () => {
    const p = prompt({
      topic: 'M2-RFG1',
      recipe: { kind: 'mcq', marks: 1, difficulty: 1 },
      objectives: [objective('Compute terms of a sequence given a rule.')],
    });
    expect(p).not.toContain('PAPER PATTERNS');
    expect(p).not.toContain('FUNCTION NOTATION');
    expect(p).not.toContain('SEQUENCE/PATTERN SHAPE');
  });
});

describe('buildDraftPrompt — figures are sketches, not scale drawings', () => {
  it('forbids measuring off a diagram, which our templates cannot support', () => {
    const p = buildDraftPrompt({
      topicTitle: 'Geometry',
      objectives: [objective('Solve geometric problems using properties of triangles.')],
      recipe: recipe({ representation: 'diagram' }),
      context: { topic_code: 'M2-GEO1', topic_codes: ['M2-GEO1'], template_hints: ['triangleLabeled'] },
      module: 2,
      visualContract: '',
    });
    expect(p).toContain('not drawn to scale');
    expect(p).toContain('never ask the student to MEASURE');
    expect(p).toContain('name the instruments');
  });

  it('says none of that when there is no figure to misdescribe', () => {
    expect(prompt({ topic: 'M2-ALG2' })).not.toContain('not drawn to scale');
  });

  it('tells the truth about a graph: the grid IS to scale', () => {
    const p = buildDraftPrompt({
      topicTitle: 'Relations, Functions and Graphs',
      objectives: [objective('Draw and interpret graphs of quadratic functions.')],
      recipe: recipe({ representation: 'graph' }),
      context: { topic_code: 'M2-RFG1', topic_codes: ['M3-REL1'], template_hints: ['coordinateGrid'] },
      module: 2,
      visualContract: '',
    });
    expect(p).toContain('IS to scale');
    expect(p).toContain('Reading a value, an intercept, a gradient or a turning point off it is fair');
    // It names the phrase only to forbid it; what must be absent is the sketch rule.
    expect(p).toContain('Do not write "not drawn to scale" on it');
    expect(p).not.toContain('LABELLED SKETCH');
  });
});

describe('buildDraftPrompt — R1.6 §1/§2 part fields', () => {
  it('documents every response mode and forbids the one we do not generate', () => {
    const p = prompt({ topic: 'M2-ALG2' });
    expect(p).toContain('"response_mode"');
    expect(p).toContain('"show_that"');
    expect(p).toContain('Never "construct"');
  });

  it('requires an accuracy on answers that do not terminate, as the papers do', () => {
    const p = prompt({ topic: 'M2-GEO1' });
    expect(p).toContain('correct to 3 significant figures');
    expect(p).toContain('"sf:3"');
    expect(p).toContain('Never demand an accuracy the mathematics does not need');
  });

  it('ties answer_format to wording that actually demands a form', () => {
    const p = prompt({ topic: 'M2-ALG2' });
    expect(p).toContain('"answer_format"');
    for (const f of ['exact', 'surd', 'standard_form', 'lowest_terms', 'equation_form', 'sf:N', 'dp:N']) {
      expect(p).toContain(f);
    }
    expect(p).toContain('if you do not demand a form, omit the field');
  });
});

// The first R1.6 batch returned 71 parts with response_mode defaulted and
// answer_format never set, and the solve pass answered "5" to a part that asked
// for a reason — so the gate compared a reason against a number.
describe('buildSolvePrompt — the solver is told what shape each part wants', () => {
  const build = (mode: string) =>
    buildSolvePrompt({
      stem: 'The diagram shows a regular pentagon.',
      kind: 'structured',
      partPrompts: [
        { label: 'a', prompt: 'Calculate the interior angle.', mode: 'answer' },
        { label: 'b', prompt: 'State how many lines of symmetry it has, and give a reason.', mode },
      ],
    });

  it('asks for a reason where the part asks for one', () => {
    expect(build('explain')).toContain('[give the reason, in one short sentence]');
  });

  it('asks a show_that part for the result its working reaches', () => {
    expect(build('show_that')).toContain('[state the result your working reaches]');
  });

  it('leaves plain answer parts values-only, as before', () => {
    const p = build('answer');
    expect(p).not.toContain('[give the reason');
    expect(p).toContain('ONLY that part’s final value(s)'.replace('’', "'"));
  });
});

// A GEO1 batch produced four isosceles-triangle-and-symmetry questions that
// differed only in the apex angle, and lost three attempts to the dedup gate.
// The gate can only reject what has already been paid for.
describe('buildDraftPrompt — the model is shown what the topic already holds', () => {
  const withBank = (existingStems: string[]) =>
    buildDraftPrompt({
      topicTitle: 'Geometry',
      objectives: [objective('Solve problems involving the properties of triangles.')],
      recipe: recipe(),
      context: context('M2-GEO1'),
      module: 2,
      visualContract: '',
      existingStems,
    });

  it('lists existing stems and asks for something different in kind', () => {
    const p = withBank([
      'The labelled sketch shows isosceles triangle $PQR$, where $PQ = PR$ and $\\angle QPR = 40°$.',
      'In triangle $ABC$, $AB = AC$ and $\\angle BAC = 52°$.',
    ]);
    expect(p).toContain('ALREADY IN THE BANK');
    expect(p).toContain('isosceles triangle $PQR$');
    expect(p).toContain('not just the numbers or the letters');
  });

  it('truncates long stems so the bank cannot crowd out the recipe', () => {
    const long = `The diagram shows ${'a very long context sentence '.repeat(20)}`;
    const p = withBank([long]);
    const line = p.split('\n').find((l) => l.startsWith('- The diagram shows'))!;
    // 200 now rather than 140: each entry leads with the stimulus, where the
    // identifying mathematics lives, and 140 could cut before reaching it.
    expect(line.length).toBeLessThan(210);
  });

  it('says nothing at all when the topic is empty', () => {
    expect(withBank([])).not.toContain('ALREADY IN THE BANK');
    expect(withBank(['  '])).not.toContain('ALREADY IN THE BANK');
  });
});

// R1.7 §B2 — the 2027 sheet supplies more than the legacy one, which changes
// what a question may make hard.
describe('buildDraftPrompt — the supplied formulae sheet', () => {
  const p = () => prompt({ topic: 'M1-CONS' });

  it('lists the formulae newly supplied in 2027', () => {
    for (const f of ['compound interest', 'sphere', 'cone', 'Pythagoras', 'n(A \\cup B)', '\\pi d']) {
      expect(p().toLowerCase()).toContain(f.toLowerCase());
    }
  });

  it('forbids difficulty that rests on recalling them', () => {
    expect(p()).toContain('NEVER build a question whose difficulty is recalling one of them');
    expect(p()).toContain('never award a mark for stating one');
  });
});

// R1.7 §B5 — the recipe fixes a Paper 1 item's cognitive level; the model is
// told which, and what that level means for the item it writes.
describe('buildDraftPrompt — Paper 1 profile is dictated, not chosen', () => {
  const mcq = (profile?: 'CK' | 'AK' | 'R') =>
    buildDraftPrompt({
      topicTitle: 'Number Theory',
      objectives: [objective('Identify prime and composite numbers.')],
      recipe: recipe({ kind: 'mcq', marks: 1, difficulty: 1, profile }),
      context: context('M1-NTC'),
      module: 1,
      visualContract: '',
    });

  it('states the profile and what it demands of the item', () => {
    expect(mcq('CK')).toContain('profile: CK');
    expect(mcq('CK')).toContain('recognising or recalling a concept');
    expect(mcq('R')).toContain('translating, comparing, justifying');
  });

  it('no longer invites the model to pick the profile itself', () => {
    expect(mcq('AK')).not.toContain('Set "profile" to the single profile the item assesses');
    expect(mcq('AK')).toContain('Set "profile" to exactly this');
  });

  it('says nothing about profile on a structured recipe', () => {
    expect(prompt({ topic: 'M2-ALG2' })).not.toContain('profile:');
  });
});

// R1.7 Part D — a misconception a model invents is a plausible guess; these are
// what candidates actually did, so the prompt offers them where they fit.
describe('buildDraftPrompt — documented errors reach the question that needs them', () => {
  it('offers the consumer-arithmetic errors on a consumer-arithmetic recipe', () => {
    const p = buildDraftPrompt({
      topicTitle: 'Consumer Arithmetic',
      objectives: [objective('Solve problems involving compound interest.')],
      recipe: recipe({ objective_ids: ['M1.2.4'] }),
      context: context('M1-CONS'),
      module: 1,
      visualContract: '',
    });
    expect(p).toContain('DOCUMENTED ERRORS');
    expect(p).toContain('Simple interest used for compound interest');
    expect(p).not.toContain('Range given as an interval');
  });

  it('offers the statistics errors on a statistics recipe', () => {
    const p = buildDraftPrompt({
      topicTitle: 'Statistics',
      objectives: [objective('Determine the mode of a data set.')],
      recipe: recipe({ objective_ids: ['M2.1.10'] }),
      context: context('M2-STAT1'),
      module: 2,
      visualContract: '',
    });
    expect(p).toContain('Modal frequency given instead of the modal value');
    expect(p).not.toContain('Amount given instead of interest');
  });
});

// Three M1-ALG1 drafts were lost to the same disagreement: the draft answered
// {x : x >= 15} and an independent solver answered {x in N : x >= 15} for a
// count of pairs. Neither is a slip — the question never said which.
describe('buildDraftPrompt — a solution set has to say what it is a set of', () => {
  it('requires the domain to be fixed in the question and carried into the answer', () => {
    const p = prompt({ topic: 'M1-ALG1' });
    expect(p).toContain('SOLUTION SET');
    expect(p).toContain('whether it is a whole number');
    expect(p).toContain('including 15.4 pairs');
  });
});

// The solve pass only gets asked about the figure when there is one.
describe('buildSolvePrompt — the figure check rides along with the visual', () => {
  const base = { stem: 'Triangle $ABC$ has $AB = 4$ cm.', kind: 'structured' as const, partPrompts: [{ label: 'a', prompt: 'Find $BC$.', mode: 'answer' }] };

  it('asks for a verdict when a figure is supplied', () => {
    const p = buildSolvePrompt({ ...base, visualText: 'Triangle ABC. Side CA is marked 4 cm.' });
    expect(p).toContain('BEFORE SOLVING');
    expect(p).toContain('"contradicts"');
    expect(p).toContain('"under_determined"');
    expect(p).toContain('figure_check');
  });

  it('asks nothing of the kind on a prose question', () => {
    const p = buildSolvePrompt(base);
    expect(p).not.toContain('BEFORE SOLVING');
    expect(p).not.toContain('figure_check');
    // Nothing can be read off a figure that does not exist.
    expect(p).not.toContain('read_off_figure');
  });

  it('asks whether the answer is simply legible in the figure', () => {
    const p = buildSolvePrompt({ ...base, visualText: 'A grid with a shaded region.' });
    expect(p).toContain('read_off_figure');
    expect(p).toContain('without doing the mathematics the part is asking for');
  });

  it('does not invite a verdict on a merely uninformative sketch', () => {
    const p = buildSolvePrompt({ ...base, visualText: 'Triangle ABC.' });
    expect(p).toContain('A figure that is a plain sketch of what the words describe is consistent');
  });
});

// A 10-mark question was being rejected over its 1-mark opening part, because
// the model kept opening by transcribing: "the coordinates of A are (2,1)"
// followed by "write OA as a column vector". The corpus says the gate is right
// and the prompt was wrong — 30% of real questions open on one mark, and not
// one of the fourteen opens by copying.
describe('buildDraftPrompt — the opening part', () => {
  it('tells the model to open small but never by transcribing', () => {
    const p = prompt({ topic: 'M3-VM2' });
    expect(p).toContain('THE OPENING PART MUST DEMAND A STEP');
    expect(p).toContain('30% of real questions open with a single mark');
    expect(p).toContain('The entry step is a step');
  });

  it('names the corpus openings rather than describing them abstractly', () => {
    const p = prompt({ topic: 'M2-STAT1' });
    for (const shape of ['EVALUATE', 'FACTORISE', 'SUBSTITUTE', 'APPLY A DEFINITION', 'FORM', 'DEDUCE']) {
      expect(p).toContain(shape);
    }
  });
});

// The avoid-list is what stops the model rewriting a question it has already
// written. It was built from stems alone, and a stem is a lead-in: ten
// questions on one objective all read "Use the graph to answer the parts
// below", so four consecutive drafts used x^2-4x+3 without the model ever
// being shown that it had.
describe('the avoid-list carries the mathematics, not just the lead-in', () => {
  const build = (existingStems: string[]) =>
    buildDraftPrompt({
      topicTitle: 'Relations, functions and graphs',
      objectives: [{ id: 'M3.2.5', text: 'Interpret graphs of functions.' }],
      recipe: {
        objective_ids: ['M3.2.5'],
        kind: 'structured',
        difficulty: 2,
        marks: 10,
        archetype: 'multi-step-application',
        representation: 'graph',
        shape: 'paper',
      },
      context: { topic_code: 'M3-RFG2', topic_codes: ['M3-RFG2'], template_hints: ['coordinateGrid'] },
      module: 3,
      visualContract: '',
      existingStems,
    });

  it('shows the function a previous question used', () => {
    const p = build([
      'A bakery uses the function $f: x \\to x^2 - 4x + 3$ to model its profit, in hundreds of dollars, $x$ hours after opening. Use the graph to answer the parts below.',
    ]);
    expect(p).toContain('ALREADY IN THE BANK');
    expect(p).toContain('x^2 - 4x + 3');
  });

  it('keeps enough of a long stimulus to reach the mathematics', () => {
    const long = `${'A regional ferry operator records passenger numbers over a long period of trading. '.repeat(1)}The function is $g: x \\to 2x^2 - 5x + 1$.`;
    const p = build([long]);
    expect(p).toContain('2x^2 - 5x + 1');
  });
});

// The examples WERE the defaults. This prompt named "a market vendor", "a
// farmer", "the school canteen" and always printed the first six livelihoods —
// and the bank came out with farmer in 32 questions, shopkeeper in 16 and
// market vendor in 11. A model shown the same examples writes the same world.
describe('setting variety', () => {
  const livelihoods = (g: string) => (g.match(/livelihoods such as ([^;]+);/) ?? [])[1] ?? '';

  it('shows different examples for different objectives', () => {
    const a = livelihoods(flavourGuidance([], undefined, 'M1.4.1'));
    const b = livelihoods(flavourGuidance([], undefined, 'M2.3.5'));
    expect(a).not.toBe(b);
    expect(a).not.toBe('');
  });

  it('avoids the actor a recent question actually used, not only ours', () => {
    // recentFlavour only knew words from FLAVOUR, so the two favourites the
    // model invented for itself were free to repeat forever.
    expect(recentActors(['A contractor installs a mast.'])).toContain('contractor');
    expect(recentActors(['A manufacturer produces batches of chips.'])).toContain('manufacturer');
    const g = flavourGuidance(['A contractor installs a mast.'], undefined, 'M1.4.1');
    expect(g).toContain('contractor');
    expect(g).toContain('pick differently');
  });

  it('finds no actor where there is no person', () => {
    expect(recentActors(['The graph shows a curve through the origin.'])).toEqual([]);
  });
});
