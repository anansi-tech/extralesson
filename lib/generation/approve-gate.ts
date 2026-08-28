import { verifyQuestionVisual, verifyStimulusTable } from '@/lib/visuals/verify';
import { independentSolve, type SolveOutcome } from './solve';
import type { QuestionDraft } from '@/lib/validation/question';

// Edit→Approve gate (R1.5 §5): an edited question re-runs the SAME checks a
// generated draft faces — visual verify, then an independent solve — before
// it can be approved. Zod runs before this in the caller.

export interface ApprovalGateResult {
  ok: boolean;
  reason?: string;
}

export async function approvalGate(
  draft: QuestionDraft,
  solve: (d: QuestionDraft) => Promise<SolveOutcome> = independentSolve,
): Promise<ApprovalGateResult> {
  if (draft.visual) {
    const vres = verifyQuestionVisual(draft.visual as never, {
      stimulus: draft.stimulus,
      stem: draft.stem,
      partPrompts: draft.parts.map((p) => p.prompt),
    });
    if (!vres.ok) {
      return { ok: false, reason: `visual verify failed: ${vres.issues.join(' | ')}` };
    }
  }
  if (draft.stimulus_table) {
    const tres = verifyStimulusTable(draft.stimulus_table, {
      stimulus: draft.stimulus,
      stem: draft.stem,
      partPrompts: draft.parts.map((p) => p.prompt),
    });
    if (!tres.ok) {
      return { ok: false, reason: `stimulus table verify failed: ${tres.issues.join(' | ')}` };
    }
  }
  const outcome = await solve(draft);
  if (!outcome.agrees) {
    return {
      ok: false,
      reason: `independent solve disagreed — draft: ${outcome.draftAnswer} · solver: ${outcome.solveAnswer}`,
    };
  }
  return { ok: true };
}
