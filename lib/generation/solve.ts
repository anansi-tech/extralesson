import { z } from 'zod';
import { generateObject } from 'ai';
import { model } from '@/lib/ai';
import { buildSolvePrompt } from '@/lib/prompts/question-gen';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { roundingOf } from '@/lib/grade/rounding';
import { adjudicateAnswers } from './adjudicate';
import { describeVisual, describeStimulusTable, type StoredVisual } from '@/lib/visuals';
import type { QuestionDraft } from '@/lib/validation/question';
import { symbolicVerdict } from '@/lib/grade/checkable';

// Independent solve pass (R1.5 §5), shared by the generation pipeline and the
// Edit→Approve path. Fresh model call; for visual questions the solver
// receives stimulus + a TEXT rendering of the visual params — never SVG,
// never the draft's answers.

// The solve pass is the one place that reads figure and question together with
// fresh eyes, so one verdict field covers every mismatch class: a rule per class
// (a length on the wrong side, a blank render, a sketch asked for coordinates)
// does not scale.
const FigureCheckZ = z.object({
  verdict: z.enum(['consistent', 'contradicts', 'under_determined']),
  note: z.string().max(240).default(''),
});

const McqSolveZ = z.object({
  figure_check: FigureCheckZ.optional(),
  answer_index: z.number(),
  final_answer: z.string(),
});
const StructuredSolveZ = z.object({
  figure_check: FigureCheckZ.optional(),
  part_answers: z.array(
    z.object({
      label: z.string(),
      final_answer: z.string(),
      // Whether answering this part cost anything. Default true so a solver
      // that omits the field cannot silently fail every question.
      new_work: z.boolean().default(true),
      new_work_note: z.string().max(200).default(''),
      // Distinct from new_work: reading a value off a graph IS work for a
      // one-mark "state the coordinates of P", and stops being work where the
      // rubric pays for a derivation the student can read off instead. Default
      // false so a solver that omits the field cannot fail every question.
      read_off_figure: z.boolean().default(false),
    }),
  ),
});

export interface SolveOutcome {
  agrees: boolean;
  draftAnswer: string;
  solveAnswer: string;
  /** How each contested part was settled — printed with every rejection. */
  notes: string[];
}

// A figure that contradicts its question is rejected; one that leaves the
// question unanswerable is reported, because "under-determined" is a judgement
// about what a solver could read off a description of the picture, and a
// reviewer looking at the picture itself is better placed to make it.
function figureNotes(check?: { verdict: string; note: string }): {
  contradicts: boolean;
  notes: string[];
} {
  if (!check || check.verdict === 'consistent') return { contradicts: false, notes: [] };
  return {
    contradicts: check.verdict === 'contradicts',
    notes: [`figure ${check.verdict.replace('_', '-')}: ${check.note}`],
  };
}

/**
 * A statement with every gap shown as ___ and the one being asked for marked,
 * so a solver reading one slot at a time knows which blank is its own.
 */
export function clozeWithGapMarked(statement: string, index: number): string {
  let seen = -1;
  return statement.replace(/\{\}/g, () => {
    seen += 1;
    return seen === index ? '[___ THIS GAP ___]' : '___';
  });
}

export async function independentSolve(draft: QuestionDraft): Promise<SolveOutcome> {
  const questionContext = {
    stimulus: draft.stimulus,
    stem: draft.stem,
    partPrompts: (draft.kind === 'structured' ? draft.parts : []).map((p) => p.prompt),
  };
  // A solver that cannot see the given table cannot answer the question.
  const visualText =
    [
      draft.visual ? describeVisual(draft.visual as StoredVisual, questionContext) : undefined,
      draft.stimulus_table ? describeStimulusTable(draft.stimulus_table, questionContext) : undefined,
    ]
      .filter(Boolean)
      .join('\n') || undefined;

  if (draft.kind === 'mcq') {
    const { object: sol } = await generateObject({
      model,
      schema: McqSolveZ,
      prompt: buildSolvePrompt({
        stimulus: draft.stimulus,
        stem: draft.stem,
        kind: 'mcq',
        options: draft.options,
        visualText,
      }),
    });
    const figure = figureNotes(sol.figure_check);
    return {
      agrees: sol.answer_index === draft.answer_key && !figure.contradicts,
      draftAnswer: `key=${draft.answer_key} (${draft.options[draft.answer_key]})`,
      solveAnswer: `index=${sol.answer_index} (${draft.options[sol.answer_index] ?? '?'}) — "${sol.final_answer}"`,
      notes: figure.notes,
    };
  }

  const { object: sol } = await generateObject({
    model,
    schema: StructuredSolveZ,
    prompt: buildSolvePrompt({
      stimulus: draft.stimulus,
      stem: draft.stem,
      kind: 'structured',
      partPrompts: draft.parts.flatMap((p) =>
        // Mapped before it is filtered: `si` indexes the part's cloze gaps, so
        // dropping a slot first would shift every gap after it.
        p.slots.map((slot, si) => ({
          // Addressed by the slot's own reference, so a key cannot be read as
          // "the whole of part (a)" and answered once for several slots.
          label: p.slots.length === 1 ? p.label : `${p.label}.${slot.label}`,
          // A cloze part's instruction is only "Complete the statement below",
          // so without the statement the solver answers "cannot be determined"
          // and a perfectly good draft is auto-rejected as a disagreement.
          prompt: p.statement
            ? `${p.prompt} "${clozeWithGapMarked(p.statement, si)}" — give the answer for gap ${si + 1}.`
            : slot.prompt
              ? `${p.prompt} ${slot.prompt}`
              : p.prompt,
          mode: slot.response_mode ?? 'answer',
        })).filter((sl) => sl.mode !== 'construct'),
      ),
      visualText,
    }),
  });

  // "(a)", "a)", " A " and "a" are one label; "a.ii" and "(a)(ii)" are one slot.
  // A formatting difference is not a disagreement, and a whole run was lost to
  // the model echoing the parenthesised form from the parts list.
  const clean = (l: string) =>
    l
      .trim()
      .toLowerCase()
      .replace(/\)\s*\(/g, '.') // "(a)(ii)" is a.ii, which the comment claimed and the old matcher did not do
      .replace(/[()\[\]]/g, '')
      .replace(/[.:]\s*$/, '');

  /**
   * THE SOLVER NAMES A PART; THE GATE ASKS ABOUT A SLOT, and those are the same
   * thing only where the part has ONE slot — which is also where the ref below
   * is the bare part label. So a gate asking about "a" and a solver answering
   * "(a.i)" are talking about the same answer, and requiring the two strings to
   * match refused d0dd1a four times in ten with 24.5 written on both sides. The
   * operator was told the independent solve disagreed.
   *
   * Where a part has several slots the ref is "d.i" or "c.modal_class" and the
   * solver has to say which. A bare "d" names no answer there, and choosing one
   * on its behalf is how a right answer to the wrong slot passes.
   *
   * The set mirrors how `askable` builds its refs — p.slots.length, not the
   * askable count — so a part whose second slot is a construct still demands
   * the slot be named.
   */
  const oneSlotParts = new Set(draft.parts.filter((p) => p.slots.length === 1).map((p) => clean(p.label)));
  const refOf = (label: string): string | null => {
    const c = clean(label);
    const part = c.split('.')[0];
    if (oneSlotParts.has(part)) return part;
    return c.includes('.') ? c : null;
  };

  const solByRef = new Map<string, string>();
  const workByRef = new Map<string, { did?: boolean; why?: string }>();
  for (const p of sol.part_answers) {
    const ref = refOf(p.label);
    if (ref === null) continue; // a bare "d" where d has several slots names nothing
    solByRef.set(ref, p.final_answer);
    workByRef.set(ref, { did: p.new_work, why: p.new_work_note });
  }
  const figure = figureNotes(sol.figure_check);
  const notes: string[] = [...figure.notes];
  // A construct slot asks for a drawing. There is nothing for a solver to
  // return and nothing to compare, so it is not asked about at all — which
  // also keeps the one-entry-per-key count the prompt demands honest.
  const askable = draft.parts.flatMap((p) =>
    p.slots.map((slot, si) => ({
      ref: p.slots.length === 1 ? p.label : `${p.label}.${slot.label}`,
      // The adjudicator judges two answers against the question they answer, so
      // it needs the statement for the same reason the solver does.
      prompt: p.statement
        ? `${p.prompt} "${clozeWithGapMarked(p.statement, si)}"`
        : (slot.prompt ?? p.prompt),
      slot,
    })).filter((sl) => sl.slot.response_mode !== 'construct'),
  );
  let agrees = sol.part_answers.length === askable.length && !figure.contradicts;

  for (const p of askable) {
    if (!agrees) break;
    const s = solByRef.get(clean(p.ref));
    if (s === undefined) {
      agrees = false;
      break;
    }
    // String equality settles values. It cannot settle the prose that a
    // "show that" derivation or an "explain" reason answers with — but those
    // are revealed to the student inside the session to self-mark, so they are
    // checked too, by the reader rather than by the rules (R1.6 §1).
    const mode = p.slot.response_mode ?? 'answer';
    const rounding = roundingOf({ answer_format: p.slot.answer_format, prompts: [p.prompt, p.slot.prompt], canonical: p.slot.answer });
    if (mode === 'answer' && answersEquivalentAny(s, p.slot.answer, p.slot.accept, rounding)) continue;

    const verdict = await adjudicateAnswers({
      partPrompt: p.prompt,
      draftAnswer: p.slot.answer,
      solveAnswer: s,
      mode,
    });
    notes.push(
      `(${p.ref}) ${mode === 'answer' ? '' : `${mode} — `}judged ${verdict.same ? 'SAME' : 'DIFFERENT'}: ${verdict.reason}`,
    );
    if (!verdict.same) agrees = false;
  }

  // A part that demands nothing is a part the student cannot get wrong, and no
  // structural check sees it: depends_on proves the parts CONNECT, which a (b)
  // restating its own premise satisfies. Only the solver, having just done the
  // work, knows what each part cost.
  const emptyParts: string[] = [];
  for (const p of askable) {
    if ((p.slot.response_mode ?? 'answer') !== 'answer') continue;
    const work = workByRef.get(clean(p.ref));
    if (work && work.did === false) {
      emptyParts.push(`(${p.ref}) demands no new work${work.why ? `: ${work.why}` : ''}`);
    }
  }
  if (emptyParts.length > 0) {
    agrees = false;
    notes.push(...emptyParts);
  }

  // Deterministic verification is AUTHORITATIVE where it applies; the solve
  // pass is a second opinion everywhere else, and independent in PROMPT only —
  // same model, same blind spot — so a systematic error survives both passes
  // agreeing. A composite-function question passed both with fg(x) computed as
  // gf(x). Asking again never catches that; arithmetic catches it at once.
  const symbolic = symbolicVerdict(draft);
  if (symbolic.failures.length > 0) {
    agrees = false;
    for (const f of symbolic.failures) {
      notes.push(`(${f.slotRef}) SYMBOLIC CHECK FAILED — ${f.family}: ${f.reason}`);
    }
  }

  return {
    agrees,
    draftAnswer: askable.map((p) => `(${p.ref}) ${p.slot.answer}`).join(' '),
    solveAnswer: sol.part_answers.map((p) => `(${p.label}) ${p.final_answer}`).join(' '),
    notes,
  };
}
