import { z } from 'zod';
import { generateObject } from 'ai';
import { model } from '@/lib/ai';
import { buildSolvePrompt } from '@/lib/prompts/question-gen';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { describeVisual, type StoredVisual } from '@/lib/visuals';
import type { QuestionDraft } from '@/lib/validation/question';

// Independent solve pass (R1.5 §5), shared by the generation pipeline and the
// Edit→Approve path. Fresh model call; for visual questions the solver
// receives stimulus + a TEXT rendering of the visual params — never SVG,
// never the draft's answers.

const McqSolveZ = z.object({ answer_index: z.number(), final_answer: z.string() });
const StructuredSolveZ = z.object({
  part_answers: z.array(z.object({ label: z.string(), final_answer: z.string() })),
});

export interface SolveOutcome {
  agrees: boolean;
  draftAnswer: string;
  solveAnswer: string;
}

export async function independentSolve(draft: QuestionDraft): Promise<SolveOutcome> {
  const visualText = draft.visual ? describeVisual(draft.visual as StoredVisual) : undefined;

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
    return {
      agrees: sol.answer_index === draft.answer_key,
      draftAnswer: `key=${draft.answer_key} (${draft.options[draft.answer_key]})`,
      solveAnswer: `index=${sol.answer_index} (${draft.options[sol.answer_index] ?? '?'}) — "${sol.final_answer}"`,
    };
  }

  const { object: sol } = await generateObject({
    model,
    schema: StructuredSolveZ,
    prompt: buildSolvePrompt({
      stimulus: draft.stimulus,
      stem: draft.stem,
      kind: 'structured',
      partPrompts: draft.parts.map((p) => ({ label: p.label, prompt: p.prompt })),
      visualText,
    }),
  });

  const solByLabel = new Map(sol.part_answers.map((p) => [p.label.toLowerCase(), p.final_answer]));
  // Per-part agreement: every part's solver answer must be equivalent.
  const agrees =
    sol.part_answers.length === draft.parts.length &&
    draft.parts.every((p) => {
      const s = solByLabel.get(p.label);
      return s !== undefined && answersEquivalentAny(s, p.answer, p.accept);
    });

  return {
    agrees,
    draftAnswer: draft.parts.map((p) => `(${p.label}) ${p.answer}`).join(' '),
    solveAnswer: sol.part_answers.map((p) => `(${p.label}) ${p.final_answer}`).join(' '),
  };
}
