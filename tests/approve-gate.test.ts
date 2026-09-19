import { describe, expect, it } from 'vitest';
import { approvalGate } from '@/lib/generation/approve-gate';
import { withTemplates } from '@/lib/grade/claim-template';
import type { QuestionDraft } from '@/lib/validation/question';
import type { SolveOutcome } from '@/lib/generation/solve';

// Regression test for the Edit→Approve gate (R1.5 §5 / DoD-4): an edited
// question must pass visual verify AND an independent re-solve before
// approval. The solve pass is stubbed; visual verify runs for real.

const baseDraft: QuestionDraft = withTemplates({
  kind: 'structured',
  objective_ids: ['M1.5.10'],
  module: 1,
  stem: 'In triangle $ABC$, angle $A = 60°$ and angle $B = 80°$. Use the diagram.',
  archetype: 'multi-step-application',
  representation: 'diagram',
  visual: {
    template: 'triangleLabeled',
    params: {
      vertices: ['A', 'B', 'C'],
      angles: [
        { vertex: 0, label: '60°', value: 60 },
        { vertex: 1, label: '80°', value: 80 },
      ],
    },
  },
  difficulty: 1,
  marks: 2,
  parts: [{ label: 'a', prompt: 'Find angle $C$.', marks: 2, slots: [{ label: 'i', answer: '40°', response_mode: 'answer' as const }] }],
  rubric: [
    { code: 'AK1', profile: 'AK', criterion: 'Angle sum of a triangle', mark_value: 2, slot_ref: 'a.i', part_label: 'a' },
  ],
  final_answer: '40°',
  worked_solution: '$180 - 60 - 80 = 40°$.',
  misconceptions: [],
} as unknown as QuestionDraft) as QuestionDraft;

const agree = async (): Promise<SolveOutcome> => ({
  notes: [],
  agrees: true,
  draftAnswer: '(a) 40°',
  solveAnswer: '(a) 40°',
});
const disagree = async (): Promise<SolveOutcome> => ({
  notes: [],
  agrees: false,
  draftAnswer: '(a) 40°',
  solveAnswer: '(a) 50°',
});

describe('approvalGate — Edit→Approve re-runs the gates', () => {
  it('passes a consistent edit whose re-solve agrees', async () => {
    const res = await approvalGate(baseDraft, agree);
    expect(res).toEqual({ ok: true, failed: [], tolerated: [] });
  });

  it('rejects when the independent re-solve disagrees', async () => {
    const res = await approvalGate(baseDraft, disagree);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('independent solve disagreed');
  });

  it('rejects an edit that breaks the visual (angle values inconsistent with 180°)', async () => {
    const broken: QuestionDraft = {
      ...baseDraft,
      visual: {
        template: 'triangleLabeled',
        params: {
          vertices: ['A', 'B', 'C'],
          angles: [
            { vertex: 0, label: '60°', value: 60 },
            { vertex: 1, label: '80°', value: 80 },
            { vertex: 2, label: '90°', value: 90 }, // 60+80+90 ≠ 180
          ],
        },
      },
    } as unknown as QuestionDraft;
    let solveCalled = false;
    const res = await approvalGate(broken, async () => {
      solveCalled = true;
      return agree();
    });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('visual verify failed');
    expect(solveCalled).toBe(false); // visual verify runs BEFORE the solve
  });

  it('skips visual verify for prose questions but still re-solves', async () => {
    const prose: QuestionDraft = {
      ...baseDraft,
      representation: 'prose',
      visual: undefined,
      stem: 'Two angles of a triangle measure $60°$ and $80°$. Find the third.',
    } as unknown as QuestionDraft;
    expect((await approvalGate(prose, agree)).ok).toBe(true);
    expect((await approvalGate(prose, disagree)).ok).toBe(false);
  });
});

/**
 * EVERY ROW IS A CLAIM ABOUT THE PAGE (ROUND_5 Task 1). The marker is shown it
 * in the student's own numbers, so a row that cannot be rendered that way is
 * refused here — where it can be fixed — rather than marked against the
 * author's literals, which is what claimsFor's fallback did quietly.
 */
describe('the gate refuses a rubric row that cannot be claimed', () => {
  const prose = (over: Partial<QuestionDraft>): QuestionDraft =>
    ({ ...baseDraft, representation: 'prose', visual: undefined, ...over }) as unknown as QuestionDraft;

  it('refuses a row with no template at all', async () => {
    const bare = prose({ rubric: [{ code: 'AK1', profile: 'AK', criterion: 'Angle sum of a triangle', mark_value: 2, slot_ref: 'a.i', part_label: 'a' }] } as never);
    const res = await approvalGate(bare, agree);
    expect(res.ok).toBe(false);
    expect(res.failed).toContain('template');
    expect(res.reason).toContain('AK1 has no template');
  });

  it('refuses a reference to a slot the row does not depend on', async () => {
    const reaching = prose({
      rubric: [{ code: 'AK1', profile: 'AK', criterion: 'Angle sum of a triangle', mark_value: 2, slot_ref: 'a.i', part_label: 'a', template: 'Adds {b.i} to the sum' }],
    } as never);
    const res = await approvalGate(reaching, agree);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('{b.i}, which a.i does not depend on');
  });

  /**
   * THE AMBIGUITY RULE READS part.statement, fixed 16 Sep. A requirement
   * written only in a cloze was invisible as a constant, so a criterion's 55
   * looked like the student's answer alone: nine rows across three questions
   * templated a question's own requirement as a student value, and a student
   * whose part (b) read 67.3% was marked against "an amount equal to 67.3%
   * satisfies the condition at least 67.3%" — true of any number at all.
   */
  it('refuses a literal that is both the question’s own requirement and a slot value', async () => {
    const inStatement = prose({
      stem: 'A factory checks a batch.',
      parts: [{
        label: 'a', prompt: 'Complete the statement.', marks: 2,
        statement: 'The required proportion is $55\\%$. The batch reached {} and so {} the requirement.',
        slots: [
          { label: 'i', answer: '55\\%', response_mode: 'answer' },
          { label: 'ii', answer: 'meets', response_mode: 'answer' },
        ],
      }],
      rubric: [{ code: 'AK1', profile: 'AK', criterion: 'Reaches $55\\%$, the required proportion', mark_value: 2, slot_ref: 'a.i', part_label: 'a' }],
    } as never);
    // 'statement' is passed as known: the cloze form is refused for NEW
    // questions, and this one stands for one already in the bank, where the
    // templates still have to be derived correctly.
    const res = await approvalGate(withTemplates(inStatement as never) as QuestionDraft, agree, ['statement']);
    expect(res.ok).toBe(false);
    expect(res.failed).toContain('template');
    expect(res.reason).toContain('is a question constant and the value of a.i');
  });

  it('passes once the templates are derived, and says nothing about an MCQ', async () => {
    expect((await approvalGate(withTemplates(prose({}) as never) as QuestionDraft, agree)).failed).not.toContain('template');
    // An MCQ carries exactly one part and no rubric, so it has no claims to make.
    const mcq = { ...baseDraft, kind: 'mcq', representation: 'prose', visual: undefined, options: ['40°', '50°', '60°', '70°'], answer_key: 0, rubric: undefined } as unknown as QuestionDraft;
    expect((await approvalGate(mcq, agree)).failed).not.toContain('template');
  });
});

/**
 * THE CLOZE FORM IS PAPER 03, NOT PAPER 02. A part printing a sentence with
 * gaps is the School-Based Assessment's shape; four Paper 02s and the 2027
 * syllabus's Glossary of Examination Terms — 45 command words, no "Complete" —
 * say the written paper does not set it. A student practising for Paper 02
 * should not meet an item Paper 02 does not set.
 */
describe('a part that completes a statement in place', () => {
  const cloze = {
    ...baseDraft,
    representation: 'prose',
    visual: undefined,
    parts: [{
      label: 'a', prompt: 'Complete the statement below.', marks: 2,
      statement: 'The third angle is {} degrees.',
      slots: [{ label: 'i', answer: '40', response_mode: 'answer' }],
    }],
  } as unknown as QuestionDraft;

  it('is refused on a new question, and says which part', async () => {
    const res = await approvalGate(withTemplates(cloze as never) as QuestionDraft, agree);
    expect(res.ok).toBe(false);
    expect(res.failed).toContain('statement');
    expect(res.reason).toContain('Paper 03 form');
    expect(res.reason).toContain('(a)');
  });

  it('is tolerated where it was already there, so an unrelated edit still lands', async () => {
    const res = await approvalGate(withTemplates(cloze as never) as QuestionDraft, agree, ['statement']);
    expect(res.ok).toBe(true);
    expect(res.failed).toContain('statement');
    expect(res.tolerated).toContain('statement');
  });

  it('says nothing about a part that has no statement', async () => {
    expect((await approvalGate(withTemplates(baseDraft as never) as QuestionDraft, agree)).failed).not.toContain('statement');
  });
});
