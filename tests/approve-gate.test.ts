import { describe, expect, it } from 'vitest';
import { approvalGate } from '@/lib/generation/approve-gate';
import type { QuestionDraft } from '@/lib/validation/question';
import type { SolveOutcome } from '@/lib/generation/solve';

// Regression test for the Edit→Approve gate (R1.5 §5 / DoD-4): an edited
// question must pass visual verify AND an independent re-solve before
// approval. The solve pass is stubbed; visual verify runs for real.

const baseDraft: QuestionDraft = {
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
  parts: [{ label: 'a', prompt: 'Find angle $C$.', marks: 2, answer: '40°', response_mode: 'answer' as const }],
  rubric: [
    { code: 'AK1', profile: 'AK', criterion: 'Angle sum of a triangle', mark_value: 2, part_label: 'a' },
  ],
  final_answer: '40°',
  worked_solution: '$180 - 60 - 80 = 40°$.',
  misconceptions: [],
} as QuestionDraft;

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
    expect(res).toEqual({ ok: true });
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
    } as QuestionDraft;
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
    } as QuestionDraft;
    expect((await approvalGate(prose, agree)).ok).toBe(true);
    expect((await approvalGate(prose, disagree)).ok).toBe(false);
  });
});
