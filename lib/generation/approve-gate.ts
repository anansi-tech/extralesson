import { questionDisagreements } from '@/lib/grade/answer-agrees';
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
  // The SLOT prompts too, which is the text scripts/generate.ts checks
  // against. A question stating its coordinates in a slot prompt passed
  // generation and was refused here, for text only one gate could see.
  const partPrompts = draft.parts.flatMap((p) => [p.prompt, ...(p.slots ?? []).map((s) => s.prompt ?? '')]);

  if (draft.visual) {
    const vres = verifyQuestionVisual(draft.visual as never, {
      stimulus: draft.stimulus,
      stem: draft.stem,
      partPrompts,
    });
    if (!vres.ok) {
      return { ok: false, reason: `visual verify failed: ${vres.issues.join(' | ')}` };
    }
  }
  if (draft.stimulus_table) {
    const tres = verifyStimulusTable(draft.stimulus_table, {
      stimulus: draft.stimulus,
      stem: draft.stem,
      partPrompts,
    });
    if (!tres.ok) {
      return { ok: false, reason: `stimulus table verify failed: ${tres.issues.join(' | ')}` };
    }
  }
  /**
   * A QUESTION THAT DISAGREES WITH ITSELF, before anything is asked of a model.
   * A slot whose accept list does not compare equal to its own canonical, or
   * whose canonical does not survive a rewrite that changes notation and not
   * value, cannot be answered correctly by anybody — so it is refused here
   * rather than found by the student who meets it.
   */
  const findings = questionDisagreements(draft.parts);
  // A value nothing here can evaluate is a different fault from a value that
  // disagrees: the question is not wrong, it is UNCHECKABLE, and saying so is
  // the point — an abstention that passes quietly is how \sqrt[3]{X} lived in
  // the bank for its whole life with the sweep calling every question fine.
  const blind = findings.filter((d) => d.kind === 'unparseable');
  const disagreements = findings.filter((d) => d.kind !== 'unparseable');
  if (disagreements.length > 0) {
    const said = disagreements.map((d) => `(${d.ref}) ${d.kind === 'accept' ? `accept ${JSON.stringify(d.failure)} does not equal the answer` : d.failure}`);
    return { ok: false, reason: `the question disagrees with itself: ${said.join(' | ')}` };
  }
  if (blind.length > 0) {
    return { ok: false, reason: `the comparator cannot evaluate this question's own answers, so nothing here can check it: ${blind.map((d) => `(${d.ref}) ${d.failure}`).join(' | ')}` };
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
