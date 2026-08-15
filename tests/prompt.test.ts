import { describe, expect, it } from 'vitest';
import { buildDraftPrompt, buildSolvePrompt, PROMPT_VERSION } from '@/lib/prompts/question-gen';
import type { QuestionRecipe, RecipeContext } from '@/lib/generation/recipe';
import type { Objective } from '@/lib/types';

// R1.6 §7 — the paper patterns must reach the model, and only where they apply:
// a prompt that always says everything teaches the model nothing.

const recipe = (over: Partial<QuestionRecipe> = {}): QuestionRecipe => ({
  objective_ids: ['M2.3.1'],
  kind: 'structured',
  difficulty: 2,
  marks: 7,
  archetype: 'multi-step-application',
  representation: 'prose',
  ...over,
});

const context = (topic_code: string): RecipeContext => ({ topic_code, template_hints: [] });

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
    expect(PROMPT_VERSION).toBe('v22');
  });

  it('teaches hence-or-otherwise chaining with follow-through on structured drafts', () => {
    const p = prompt({ topic: 'M2-ALG2' });
    expect(p).toContain('Hence, or otherwise');
    expect(p).toContain('follow-through');
    expect(p).toContain("student's own earlier value");
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
      context: { topic_code: 'M2-GEO1', template_hints: ['triangleLabeled'] },
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
      context: { topic_code: 'M2-RFG1', template_hints: ['coordinateGrid'] },
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
    expect(line.length).toBeLessThan(150);
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
