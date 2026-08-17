import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuestionDraft } from '@/lib/validation/question';

// The independent-solve gate (R1.5 §5, amended by R1.6 §1). Both model calls
// are stubbed: this test is about what the gate does with the answers, not
// about the model.

const calls: string[] = [];
let solverParts: { label: string; final_answer: string; new_work?: boolean; new_work_note?: string }[] = [];
let verdicts: { same: boolean; reason: string }[] = [];
let figureCheck: { verdict: string; note: string } | undefined;
let lastPrompt = '';

vi.mock('ai', () => ({
  generateObject: vi.fn(async ({ prompt }: { prompt: string }) => {
    if (prompt.startsWith('Two people answered')) {
      calls.push('judge');
      const next = verdicts.shift();
      if (!next) throw new Error('unexpected adjudication call');
      return { object: next };
    }
    calls.push('solve');
    lastPrompt = prompt;
    return { object: { part_answers: solverParts, ...(figureCheck ? { figure_check: figureCheck } : {}) } };
  }),
}));
vi.mock('@/lib/ai', () => ({ model: {}, MODEL_ID: 'test' }));

const { independentSolve, clozeWithGapMarked } = await import('@/lib/generation/solve');

function draft(parts: QuestionDraft['parts']): QuestionDraft {
  return {
    kind: 'structured',
    objective_ids: ['M2.3.11'],
    module: 2,
    stem: 'The functions $f$ and $g$ are defined for all real $x$.',
    archetype: 'multi-step-application',
    representation: 'prose',
    difficulty: 3,
    marks: parts.reduce((s, p) => s + p.marks, 0),
    parts,
    rubric: parts.map((p, i) => ({
      code: `AK${i + 1}`,
      profile: 'AK' as const,
      criterion: 'Works the part',
      mark_value: p.marks,
      part_label: p.label,
    })),
    final_answer: parts.map((p) => p.slots[0].answer).join('; '),
    worked_solution: 'Step by step.',
    misconceptions: [],
  } as unknown as QuestionDraft;
}

// A part with one answerable slot — the shape almost every drill question has.
const answerPart = (label: string, answer: string) => ({
  label,
  prompt: `Find part ${label}.`,
  marks: 2,
  slots: [{ label: 'i', answer, response_mode: 'answer' as const, rubric_codes: [], depends_on: [] }],
});

// A part governing several slots, as the papers print it.
const multiSlotPart = (
  label: string,
  prompt: string,
  slots: { label: string; answer: string; response_mode?: 'answer' | 'show_that' | 'explain' }[],
) => ({
  label,
  prompt,
  marks: slots.length * 2,
  slots: slots.map((s) => ({ ...s, response_mode: s.response_mode ?? ('answer' as const), rubric_codes: [], depends_on: [] })),
});

beforeEach(() => {
  calls.length = 0;
  verdicts = [];
  figureCheck = undefined;
});

describe('independentSolve — mechanical agreement', () => {
  it('accepts notation-different answers without asking anyone', async () => {
    solverParts = [{ label: 'a', final_answer: 'x ↦ (x - 1)/2' }];
    const out = await independentSolve(draft([answerPart('a', 'f^{-1}:x\\to \\frac{x-1}{2}')]));
    expect(out.agrees).toBe(true);
    expect(calls).toEqual(['solve']);
    expect(out.notes).toEqual([]);
  });

  it('rejects when the solver answers a different number of parts', async () => {
    solverParts = [{ label: 'a', final_answer: '4' }];
    const out = await independentSolve(draft([answerPart('a', '4'), answerPart('b', '9')]));
    expect(out.agrees).toBe(false);
    expect(calls).toEqual(['solve']);
  });
});

describe('independentSolve — prose parts are judged, never string-matched (R1.6 §1)', () => {
  it('sends a show_that part to the judge instead of comparing its restated answer', async () => {
    solverParts = [
      { label: 'a', final_answer: '4' },
      { label: 'b', final_answer: 'Expanding gives the stated result.' },
    ];
    const parts = [
      answerPart('a', '4'),
      { label: 'b', prompt: 'Show that $P = M^2 - 2M$.', marks: 3, slots: [{ label: 'i', answer: 'P = M^2 - 2M', response_mode: 'show_that' as const, rubric_codes: [], depends_on: [] }] },
    ];
    verdicts = [{ same: true, reason: 'The derivation ends at the stated result.' }];
    const out = await independentSolve(draft(parts));
    expect(out.agrees).toBe(true);
    expect(calls).toEqual(['solve', 'judge']);
    expect(out.notes.join(' ')).toContain('show_that — judged SAME');
  });

  it('accepts a differently worded reason, which the rules could never settle', async () => {
    solverParts = [{ label: 'a', final_answer: 'The two composites have different rules.' }];
    const parts = [
      { label: 'a', prompt: 'Give a reason.', marks: 1, slots: [{ label: 'i', answer: 'fg(x) != gf(x) for x != -2, 0', response_mode: 'explain' as const, rubric_codes: [], depends_on: [] }] },
    ];
    verdicts = [{ same: true, reason: 'Same reason, worded differently.' }];
    const out = await independentSolve(draft(parts));
    expect(out.agrees).toBe(true);
    expect(calls).toEqual(['solve', 'judge']);
  });

  it('rejects a show_that part whose stated result the solver contradicts', async () => {
    solverParts = [{ label: 'a', final_answer: 'P = M^2 - 3M, so the stated result is wrong.' }];
    verdicts = [{ same: false, reason: 'B derives a different expression.' }];
    const parts = [
      { label: 'a', prompt: 'Show that $P = M^2 - 2M$.', marks: 3, slots: [{ label: 'i', answer: 'P = M^2 - 2M', response_mode: 'show_that' as const, rubric_codes: [], depends_on: [] }] },
    ];
    const out = await independentSolve(draft(parts));
    expect(out.agrees).toBe(false);
    expect(out.notes.join(' ')).toContain('judged DIFFERENT');
  });
});

describe('independentSolve — adjudication settles what rules cannot', () => {
  it('accepts a part the judge calls the same, and says so in the notes', async () => {
    // Two correct answers to "solve, then say why they differ", worded freely:
    // no string rule reconciles these, and none should have to.
    solverParts = [{ label: 'a', final_answer: 'x=-2; x=0; fg(x) != gf(x) for x != -2, 0' }];
    verdicts = [{ same: true, reason: 'Same roots and the same conclusion.' }];
    const out = await independentSolve(
      draft([answerPart('a', 'x=-2 or x=0; the composite functions have different rules')]),
    );
    expect(out.agrees).toBe(true);
    expect(calls).toEqual(['solve', 'judge']);
    expect(out.notes[0]).toContain('judged SAME');
  });

  it('still rejects when the judge finds a real difference', async () => {
    solverParts = [{ label: 'a', final_answer: '7' }];
    verdicts = [{ same: false, reason: 'The values 4 and 7 differ.' }];
    const out = await independentSolve(draft([answerPart('a', '4')]));
    expect(out.agrees).toBe(false);
    expect(out.notes[0]).toContain('judged DIFFERENT');
    expect(out.draftAnswer).toContain('(a) 4');
    expect(out.solveAnswer).toContain('(a) 7');
  });

  it('asks only about the parts that failed mechanically', async () => {
    solverParts = [
      { label: 'a', final_answer: '2x^2 + 1' },
      { label: 'b', final_answer: 'They are reflections in y = x.' },
    ];
    verdicts = [{ same: true, reason: 'Same geometric statement.' }];
    const out = await independentSolve(
      draft([answerPart('a', 'fg(x)=2x^2+1'), answerPart('b', 'each is the reflection of the other in the line y = x')]),
    );
    expect(out.agrees).toBe(true);
    expect(calls.filter((c) => c === 'judge')).toHaveLength(1);
  });
});

// R1.7: three distinct figure/question mismatches have reached a review queue —
// a length labelled on the wrong side, a figure that rendered blank, a sketch
// asked to show coordinates. Each got its own rule afterwards, which does not
// scale to the ones nobody has thought of. The solve pass already sees the
// figure as text, so it is asked one more question.
describe('independentSolve — the figure is read against the question', () => {
  const withVisual = (parts: QuestionDraft['parts']): QuestionDraft => ({
    ...draft(parts),
    representation: 'diagram',
    visual: { template: 'triangleLabeled', params: { labels: ['A', 'B', 'C'] } },
  });

  it('rejects a draft whose figure contradicts its question', async () => {
    solverParts = [{ label: 'a', final_answer: '4' }];
    figureCheck = { verdict: 'contradicts', note: 'The stem says AB = 4 cm but the figure marks CA.' };
    const out = await independentSolve(withVisual([answerPart('a', '4')]));
    expect(out.agrees).toBe(false);
    expect(out.notes.join(' ')).toContain('figure contradicts');
    expect(out.notes.join(' ')).toContain('AB = 4');
  });

  it('reports an under-determined figure without rejecting it', async () => {
    solverParts = [{ label: 'a', final_answer: '4' }];
    figureCheck = { verdict: 'under_determined', note: 'The angle at B is not marked.' };
    const out = await independentSolve(withVisual([answerPart('a', '4')]));
    expect(out.agrees).toBe(true);
    expect(out.notes.join(' ')).toContain('figure under-determined');
  });

  it('says nothing when the figure and the question agree', async () => {
    solverParts = [{ label: 'a', final_answer: '4' }];
    figureCheck = { verdict: 'consistent', note: '' };
    const out = await independentSolve(withVisual([answerPart('a', '4')]));
    expect(out.agrees).toBe(true);
    expect(out.notes).toEqual([]);
  });

  it('still rejects on the answers even when the figure is fine', async () => {
    solverParts = [{ label: 'a', final_answer: '9' }];
    figureCheck = { verdict: 'consistent', note: '' };
    verdicts = [{ same: false, reason: '4 and 9 differ.' }];
    const out = await independentSolve(withVisual([answerPart('a', '4')]));
    expect(out.agrees).toBe(false);
  });
});

// A whole regeneration run — twelve attempts, nothing inserted — was lost to
// the solver echoing the parts list's "(a)" as its label while every answer
// matched. The prompt now shows the bare-letter form, and the lookup treats
// label formatting as presentation rather than data.
describe('independentSolve — a part label is a letter, however it is written', () => {
  for (const label of ['(a)', 'a)', ' A ', 'a.']) {
    it(`matches a part answered as "${label}"`, async () => {
      solverParts = [{ label, final_answer: '4' }];
      const out = await independentSolve(draft([answerPart('a', '4')]));
      expect(out.agrees).toBe(true);
      expect(calls).toEqual(['solve']);
    });
  }

  it('still notices a part the solver never answered', async () => {
    solverParts = [{ label: '(a)', final_answer: '4' }, { label: '(zz)', final_answer: '9' }];
    const out = await independentSolve(draft([answerPart('a', '4'), answerPart('b', '9')]));
    expect(out.agrees).toBe(false);
  });
});

// A cloze part's instruction is "Complete the statement below" and the
// statement IS the question. Sending the instruction alone left the solver with
// nothing to work from: it answered "cannot be determined", which reads as a
// disagreement, and a regeneration run lost 54 drafts to it.
describe('independentSolve — cloze parts reach the solver', () => {
  it('marks each gap so a solver answering one slot knows which blank is its own', () => {
    const s = 'The octagon has {} lines of symmetry and rotational symmetry of order {}.';
    expect(clozeWithGapMarked(s, 0)).toBe(
      'The octagon has [___ THIS GAP ___] lines of symmetry and rotational symmetry of order ___.',
    );
    expect(clozeWithGapMarked(s, 1)).toBe(
      'The octagon has ___ lines of symmetry and rotational symmetry of order [___ THIS GAP ___].',
    );
  });

  it('sends the statement, not just the instruction', async () => {
    solverParts = [
      { label: 'a.i', final_answer: '8' },
      { label: 'a.ii', final_answer: '8' },
    ];
    const cloze = {
      ...draft([
        {
          label: 'a',
          prompt: 'x',
          marks: 2,
          slots: [{ label: 'i', answer: '8', response_mode: 'answer' as const, rubric_codes: [], depends_on: [] }],
        },
      ] as never),
      parts: [
        {
          label: 'a',
          prompt: 'Complete the statement below.',
          marks: 2,
          statement: 'The regular octagon has {} lines of symmetry and order {}.',
          slots: [
            { label: 'i', answer: '8', response_mode: 'answer' as const, rubric_codes: [], depends_on: [] },
            { label: 'ii', answer: '8', response_mode: 'answer' as const, rubric_codes: [], depends_on: [] },
          ],
        },
      ],
    };
    const out = await independentSolve(cloze as never);
    expect(out.agrees).toBe(true);
    expect(lastPrompt).toContain('lines of symmetry');
    expect(lastPrompt).toContain('THIS GAP');
  });
});

// A part that demands nothing is a part the student cannot get wrong, and no
// structural check can see it: depends_on proves the parts CONNECT, and a
// vectors question whose (b) restated its own premise and whose (c) inverted
// (a) satisfied every gate we had. The solver has just done the work, so it is
// the only reader that knows what each part actually cost.
describe('independentSolve — a part that demands no new work', () => {
  const twoParts = () =>
    draft([
      answerPart('a', '4'),
      answerPart('b', '9'),
    ]);

  it('rejects when the solver reports a part cost nothing', async () => {
    solverParts = [
      { label: 'a', final_answer: '4', new_work: true, new_work_note: 'computed from the given vectors' },
      { label: 'b', final_answer: '9', new_work: false, new_work_note: 'stated in the stem' },
    ];
    const out = await independentSolve(twoParts());
    expect(out.agrees).toBe(false);
    expect(out.notes.join(' ')).toContain('(b) demands no new work: stated in the stem');
  });

  it('accepts when every part cost something', async () => {
    solverParts = [
      { label: 'a', final_answer: '4', new_work: true, new_work_note: 'computed' },
      { label: 'b', final_answer: '9', new_work: true, new_work_note: 'derived from (a)' },
    ];
    const out = await independentSolve(twoParts());
    expect(out.agrees).toBe(true);
  });

  it('treats a missing field as work done, so a quiet solver cannot fail everything', async () => {
    solverParts = [
      { label: 'a', final_answer: '4' },
      { label: 'b', final_answer: '9' },
    ];
    const out = await independentSolve(twoParts());
    expect(out.agrees).toBe(true);
  });

  it('judges only auto-marked parts: a show-that part restates its result by design', async () => {
    const withShowThat = draft([
      answerPart('a', '4'),
      {
        label: 'b',
        prompt: 'Show that the total is 9.',
        marks: 2,
        slots: [
          { label: 'i', answer: '9', response_mode: 'show_that' as const, rubric_codes: [], depends_on: [] },
        ],
      },
    ] as never);
    solverParts = [
      { label: 'a', final_answer: '4', new_work: true, new_work_note: 'computed' },
      { label: 'b', final_answer: '9', new_work: false, new_work_note: 'the stem states the result' },
    ];
    verdicts = [{ same: true, reason: 'same derivation' }];
    const out = await independentSolve(withShowThat);
    expect(out.agrees).toBe(true);
  });
});
