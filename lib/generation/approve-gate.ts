import { questionDisagreements } from '@/lib/grade/answer-agrees';
import { verifyQuestionVisual, verifyStimulusTable } from '@/lib/visuals/verify';
import { readOffSlots } from './read-off';
import { independentSolve, type SolveOutcome } from './solve';
import type { QuestionDraft } from '@/lib/validation/question';

// Edit→Approve gate (R1.5 §5): an edited question re-runs the SAME checks a
// generated draft faces — visual verify, then an independent solve — before
// it can be approved. Zod runs before this in the caller.

/** The checks the gate makes, named so a result can say which one refused. */
export type GateCheck =
  | 'visual'
  | 'stimulus_table'
  | 'self_disagreement'
  | 'unparseable'
  | 'read_off'
  | 'solve';

export interface ApprovalGateResult {
  ok: boolean;
  reason?: string;
  /**
   * WHOSE FAULT THE REFUSAL IS, because the operator cannot tell from the text.
   *
   * 'question' — a rule about the draft itself: a figure that does not verify,
   * an answer that disagrees with its own accept list, a value nothing can
   * evaluate. The same edit refused now is refused every time.
   *
   * 'model' — the independent solve, which asks a model to answer the question
   * and compares. It is not a rule and it does not repeat: it can refuse on one
   * run and pass on the next. An operator told only "disagreed" reads that as
   * their edit being wrong, and it is not what the check said.
   */
  kind?: 'question' | 'model';
  /** Every check that failed in this run, whether or not it refused the save. */
  failed: GateCheck[];
  /** Failures the last stored result already had, reported and not blocking. */
  tolerated: GateCheck[];
}

/**
 * A FAILURE THAT WAS ALREADY THERE DOES NOT BLOCK AN EDIT IT HAS NOTHING TO DO
 * WITH. 804a29 could not take a one-mark correction because a slot in another
 * part accepted a reordered pair, and four more questions could not take one
 * because a cloze blank restates a value. The gate refused the whole save on a
 * fault the save did not introduce and did not touch.
 *
 * So the caller hands in what the last run found, and a check in that list is
 * REPORTED rather than refused. A check that was passing and now fails still
 * refuses: that is the edit's own doing.
 *
 * The solve is deliberately absent from what the backfill records. It has never
 * been evaluated for most of the bank, and "we have not asked" is not the same
 * as "we know it was broken" — so it goes on blocking until a run records it.
 */
export async function approvalGate(
  draft: QuestionDraft,
  solve: (d: QuestionDraft) => Promise<SolveOutcome> = independentSolve,
  known: readonly GateCheck[] = [],
): Promise<ApprovalGateResult> {
  // The SLOT prompts too, which is the text scripts/generate.ts checks
  // against. A question stating its coordinates in a slot prompt passed
  // generation and was refused here, for text only one gate could see.
  const partPrompts = draft.parts.flatMap((p) => [p.prompt, ...(p.slots ?? []).map((s) => s.prompt ?? '')]);

  // EVERY DETERMINISTIC CHECK, not the first that fails: a pre-existing fault
  // can only be tolerated if it has been named, and it can only be named if it
  // was looked for.
  const found: { check: GateCheck; reason: string }[] = [];

  if (draft.visual) {
    const vres = verifyQuestionVisual(draft.visual as never, { stimulus: draft.stimulus, stem: draft.stem, partPrompts });
    if (!vres.ok) found.push({ check: 'visual', reason: `visual verify failed: ${vres.issues.join(' | ')}` });
  }
  if (draft.stimulus_table) {
    const tres = verifyStimulusTable(draft.stimulus_table, { stimulus: draft.stimulus, stem: draft.stem, partPrompts });
    if (!tres.ok) found.push({ check: 'stimulus_table', reason: `stimulus table verify failed: ${tres.issues.join(' | ')}` });
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
    found.push({ check: 'self_disagreement', reason: `the question disagrees with itself: ${said.join(' | ')}` });
  }
  if (blind.length > 0) {
    found.push({ check: 'unparseable', reason: `the comparator cannot evaluate this question's own answers, so nothing here can check it: ${blind.map((d) => `(${d.ref}) ${d.failure}`).join(' | ')}` });
  }

  // A SLOT THAT PAYS TWICE FOR ONE READ, and only where the shape is exactly
  // that: two rows over a figure, one saying where to look and one giving the
  // value. Everything else readOffSlots finds is reported by the bank sweep and
  // refused by nobody — half of that was a rubric naming its work in prose.
  const readOff = readOffSlots(draft).filter((s) => s.shape === 'exact');
  if (readOff.length > 0) {
    found.push({
      check: 'read_off',
      reason: `a slot pays twice for reading one value off the figure: ${readOff.map((s) => `(${s.ref}) ${s.marks} marks — ${s.criteria.join(' | ')}`).join(' · ')}`,
    });
  }

  const failed = found.map((f) => f.check);
  const blocking = found.filter((f) => !known.includes(f.check));
  // Still before the solve, so an edit that breaks something NEW costs no model
  // call — the saving that made this check cheap is kept.
  if (blocking.length > 0) {
    return { ok: false, kind: 'question', reason: blocking[0].reason, failed, tolerated: failed.filter((c) => known.includes(c)) };
  }

  const outcome = await solve(draft);
  if (!outcome.agrees) {
    failed.push('solve');
    if (!known.includes('solve')) {
      return {
        ok: false,
        kind: 'model',
        reason: `independent solve disagreed — draft: ${outcome.draftAnswer} · solver: ${outcome.solveAnswer}`,
        failed,
        tolerated: failed.filter((c) => c !== 'solve' && known.includes(c)),
      };
    }
  }
  return { ok: true, failed, tolerated: failed };
}
