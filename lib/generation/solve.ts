import { z } from 'zod';
import { generateObject } from 'ai';
import { model } from '@/lib/ai';
import { buildSolvePrompt } from '@/lib/prompts/question-gen';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { adjudicateAnswers } from './adjudicate';
import { describeVisual, type StoredVisual } from '@/lib/visuals';
import type { QuestionDraft } from '@/lib/validation/question';

// Independent solve pass (R1.5 §5), shared by the generation pipeline and the
// Edit→Approve path. Fresh model call; for visual questions the solver
// receives stimulus + a TEXT rendering of the visual params — never SVG,
// never the draft's answers.

// R1.7: the solve pass already receives the figure as text, so it is the one
// place that reads figure and question together with fresh eyes. Three distinct
// mismatch classes have now reached a review queue — a length on the wrong
// side, a figure that rendered blank, a sketch asked to show coordinates — and
// a rule per class does not scale. One field, in a call we already make.
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
  part_answers: z.array(z.object({ label: z.string(), final_answer: z.string() })),
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

export async function independentSolve(draft: QuestionDraft): Promise<SolveOutcome> {
  const questionContext = {
    stimulus: draft.stimulus,
    stem: draft.stem,
    partPrompts: (draft.kind === 'structured' ? draft.parts : []).map((p) => p.prompt),
  };
  const visualText = draft.visual
    ? describeVisual(draft.visual as StoredVisual, questionContext)
    : undefined;

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
      partPrompts: draft.parts.map((p) => ({
        label: p.label,
        prompt: p.prompt,
        mode: p.response_mode ?? 'answer',
      })),
      visualText,
    }),
  });

  // "(a)", "a)", " A " and "a" are one label. The prompt asks for the bare
  // letter, and a run was lost entirely to the model echoing the parenthesised
  // form from the parts list — a formatting difference is not a disagreement.
  const bareLabel = (l: string) => l.trim().toLowerCase().replace(/^\(?([a-j])\)?[.:]?$/, '$1');
  const solByLabel = new Map(sol.part_answers.map((p) => [bareLabel(p.label), p.final_answer]));
  const figure = figureNotes(sol.figure_check);
  const notes: string[] = [...figure.notes];
  let agrees = sol.part_answers.length === draft.parts.length && !figure.contradicts;

  for (const p of draft.parts) {
    if (!agrees) break;
    const s = solByLabel.get(bareLabel(p.label));
    if (s === undefined) {
      agrees = false;
      break;
    }
    // String equality settles values. It cannot settle the prose that a
    // "show that" derivation or an "explain" reason answers with — but those
    // are shown to students in worked practice, so they are checked too, by
    // the reader rather than by the rules (R1.6 §1).
    const mode = p.response_mode ?? 'answer';
    if (mode === 'answer' && answersEquivalentAny(s, p.answer, p.accept)) continue;

    const verdict = await adjudicateAnswers({
      partPrompt: p.prompt,
      draftAnswer: p.answer,
      solveAnswer: s,
      mode,
    });
    notes.push(
      `(${p.label}) ${mode === 'answer' ? '' : `${mode} — `}judged ${verdict.same ? 'SAME' : 'DIFFERENT'}: ${verdict.reason}`,
    );
    if (!verdict.same) agrees = false;
  }

  return {
    agrees,
    draftAnswer: draft.parts.map((p) => `(${p.label}) ${p.answer}`).join(' '),
    solveAnswer: sol.part_answers.map((p) => `(${p.label}) ${p.final_answer}`).join(' '),
    notes,
  };
}
