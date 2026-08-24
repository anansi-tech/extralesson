import { generateObject } from 'ai';
import { z } from 'zod';
import { model, MODEL_ID } from '@/lib/ai';
import { MARK_SCHEME_CONVENTIONS, isFollowThrough } from '@/lib/prompts/mark-scheme';
import type { RubricItem } from '@/lib/types';

/**
 * JUDGING WHETHER WRITTEN WORKING DEMONSTRATES A CRITERION.
 *
 * R2 §4. This is the judgment leg, so it stays on the capable tier, and it is
 * text-only over a transcription that already exists — never over an image.
 *
 * It runs after deterministic marking and only over rows determinism left
 * unearned, which by construction excludes CAO rows and self-marked slots
 * (lib/grade/method-marks.ts). It may only ADD marks: nothing it returns can
 * take away what the grader awarded, which is what makes a misread cost a
 * student nothing.
 *
 * The typed answer is the cross-check. Confidence in the reading turned out not
 * to predict correctness — on real photographs, lines rated 0.9+ were right 77%
 * of the time — so instead of gating on a number, the marker is shown what the
 * student actually submitted for the slot and told to withhold when the working
 * contradicts it.
 */
export const MethodDecisionZ = z.object({
  code: z.string(),
  awarded: z.boolean(),
  reason: z.string(),
  confidence: z.number(),
});

export const MethodResultZ = z.object({ decisions: z.array(MethodDecisionZ) });
export type MethodDecision = z.infer<typeof MethodDecisionZ>;

export interface MethodMarkArgs {
  /** Rows deterministic marking left unearned. CAO rows are already excluded. */
  rows: RubricItem[];
  /** The student's transcribed working, by part label. */
  workingByPart: Record<string, string[]>;
  /** What they typed, by slot ref — including slots these rows depend on. */
  typedAnswers: Record<string, string>;
  workedSolution: string;
  questionStem: string;
}

const RULES = `
HOW TO DECIDE, and these override any instinct to be generous or strict:

1. NO WORKING, NO MARK. If the lines for that part are absent, or show nothing
   relevant to the criterion, the row is not awarded. Silence earns nothing.
   Do not infer a step the student did not write.

2. FOLLOW-THROUGH IS THE POINT. A criterion written with "their" is earned when
   the METHOD is right given the student's OWN earlier value, however wrong that
   value was. You are judging the step, not re-checking arithmetic that has
   already been marked wrong. This is the case the whole feature exists for.

   ANY NUMBER PRINTED IN A FOLLOW-THROUGH CRITERION IS THE SCHEME'S OWN VALUE,
   not a value the student must produce. "Finds the remaining dollars as 'their'
   441 less 375" is earned by a student who writes 450 - 375, because 450 is
   their 441. Substitute their value for the scheme's and ask only whether the
   OPERATION is the right one. A mismatch between the printed number and the
   student's is expected — it is the whole reason the row says "their".

   An arithmetic slip inside the working does not remove a method mark either. A
   student who writes 450 - 375 = 76 and then uses 75 has still performed the
   subtraction the row asks for.

3. THE TYPED ANSWER IS THE CROSS-CHECK. You are given what the student actually
   submitted for each slot. If the working you are shown contradicts it — a
   different value, a different quantity — the transcription is unreliable for
   that row and you withhold it. Do not try to reconcile them.

4. JUDGE THE CRITERION AS WRITTEN, not the question. A criterion that asks for a
   method is earned by that method appearing. A criterion that asks for a
   particular value is earned only by that value.

   THE ACT THE CRITERION NAMES MUST BE VISIBLE IN THE WRITING. "Identifies that
   the route consists of AB and BC" is not earned by a student who writes only a
   total; "Evaluates 2.50/(2pi)" is not earned by evaluating a different
   expression that happens to look similar. A result consistent with the act is
   not the act. If you cannot point at the line where the student did the thing
   the row names, withhold.

Give a reason of one clause. confidence is your confidence in the DECISION.
`;

export async function markMethod(args: MethodMarkArgs): Promise<{
  decisions: MethodDecision[];
  usage: { input_tokens?: number; output_tokens?: number };
  model: string;
}> {
  const { rows, workingByPart, typedAnswers, workedSolution, questionStem } = args;

  const rowText = rows
    .map((r) => {
      const part = r.slot_ref.split('.')[0];
      const lines = workingByPart[part] ?? [];
      return [
        `ROW ${r.code} (${r.profile}, ${r.mark_value} mark${r.mark_value === 1 ? '' : 's'}) for part (${part})`,
        `CRITERION: ${r.criterion}`,
        isFollowThrough(r.criterion) ? 'THIS IS A FOLLOW-THROUGH ROW: judge the method on their own value.' : '',
        `THE STUDENT'S WORKING FOR (${part}):`,
        lines.length ? lines.map((l) => `  ${l}`).join('\n') : '  (nothing written for this part)',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  const answers = Object.entries(typedAnswers)
    .map(([ref, a]) => `  (${ref}) ${a}`)
    .join('\n');

  const result = await generateObject({
    model,
    schema: MethodResultZ,
    // NO temperature here, and the absence is deliberate.
    //
    // The same working, criterion and prompt return different verdicts between
    // runs — four passes over the golden set gave 93%, 92%, 91% and one below
    // the gate, with false awards moving between 0 and 1. The obvious fix was
    // temperature 0; the provider rejects it, because this is a reasoning model
    // and temperature is not a knob it has. Setting it anyway logged a warning
    // per call and changed nothing.
    //
    // So the variance is a property of the marker, not a setting we forgot, and
    // it has to be handled where it lands: a single run cannot decide the gate,
    // and the eval must be run repeatedly with the gate required to hold every
    // time. Recorded here so the next person does not try temperature again.
    prompt:
      `You are marking one CSEC Mathematics candidate's written working against a mark scheme.\n\n` +
      `QUESTION: ${questionStem}\n\n` +
      `WHAT THE STUDENT TYPED AS THEIR ANSWERS:\n${answers || '  (none recorded)'}\n\n` +
      `THE MARK SCHEME'S OWN SOLUTION (for reference):\n${workedSolution}\n\n` +
      `${MARK_SCHEME_CONVENTIONS}\n${RULES}\n\n` +
      `Decide each row below. Return one decision per row, using its exact code.\n\n${rowText}`,
  });

  return {
    decisions: result.object.decisions,
    usage: {
      input_tokens: result.usage?.inputTokens,
      output_tokens: result.usage?.outputTokens,
    },
    model: MODEL_ID,
  };
}
