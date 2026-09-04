import { generateObject } from 'ai';
import { z } from 'zod';
import { model, MODEL_ID } from '@/lib/ai';
import { MARK_SCHEME_CONVENTIONS, isFollowThrough } from '@/lib/prompts/mark-scheme';
import type { RubricItem } from '@/lib/types';

/**
 * ROUND_2 §4. Text only over an existing transcription, never an image, and it
 * may only ADD marks, so a misread costs a student nothing. Reading confidence
 * does not predict correctness (0.9+ was right 77%): the typed answer gates it.
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
  /**
   * Rows deterministic marking left unearned, CAO rows already excluded, each
   * carrying its claim rendered for this student (ROUND_5 Task 1).
   */
  rows: (RubricItem & { claim?: string })[];
  /** The student's transcribed working, by part label. */
  workingByPart: Record<string, string[]>;
  /** What they typed, by slot ref — including slots these rows depend on. */
  typedAnswers: Record<string, string>;
  workedSolution: string;
  questionStem: string;
}

const RULES = `
HOW TO DECIDE, and these override any instinct to be generous or strict:

A CRITERION IS ALREADY WRITTEN FOR THIS STUDENT'S OWN VALUES; DECIDE WHETHER
THE PAGE SHOWS IT.

1. NO WORKING, NO MARK. If the lines for that part are absent, or show nothing
   relevant to the criterion, the row is not awarded. Silence earns nothing.
   Do not infer a step the student did not write.

2. FOLLOW-THROUGH IS THE POINT. A criterion written with "their" is earned when
   the METHOD is right given the student's OWN earlier value, however wrong that
   value was. You are judging the step, not re-checking arithmetic that has
   already been marked wrong. An arithmetic slip inside the working does not
   remove a method mark either: a student who writes 450 - 375 = 76 and then
   uses 75 has still performed the subtraction the row asks for.

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

5. A REASONING ROW (profile R) IS EARNED WHEN THE REASONING THE SCHEME NAMES
   IS ON THE PAGE, IN ANY WORDING. "Compares their percentage with 90%" is
   earned by "88 is less than 90" as much as by a sentence; "Justifies that
   corresponding lengths are doubled" is earned by any line that says the
   lengths doubled. Judge the idea, not the phrasing — but the idea must be
   written, not implied by an answer.

6. WHEN A PART HAS NO LINES OF ITS OWN, ITS ROWS ARE JUDGED AGAINST THE WHOLE
   PAGE. Students write a derivation under the wrong label, or once for two
   parts. The lines shown for such a part are the whole read, and a row is
   earned if the act is anywhere on it.

THE REASON IS WRITTEN FOR THE STUDENT, and it is the only thing they get back
when a row is withheld. One clause, addressed to them, naming the step you
could not find: "we could not see where you divided by the scale factor", not
"criterion not met". A student who is told what is missing can go and look at
their page; a student told nothing has learnt nothing, and a withheld mark with
no reason is indistinguishable from a marker that is simply wrong.

Where you DID award, the reason quotes the line that earned it — for a row
that names a result, the line where that result appears.

confidence is your confidence in the DECISION.
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
      const own = workingByPart[part] ?? [];
      const lines = own.length ? own : Object.values(workingByPart).flat();
      return [
        `ROW ${r.code} (${r.profile}, ${r.mark_value} mark${r.mark_value === 1 ? '' : 's'}) for part (${part})`,
        `CRITERION: ${r.claim ?? r.criterion}`,
        isFollowThrough(r.criterion) ? 'THIS IS A FOLLOW-THROUGH ROW: judge the method on their own value.' : '',
        own.length
          ? `THE STUDENT'S WORKING FOR (${part}):`
          : `THE STUDENT'S WORKING (nothing is labelled (${part}); the whole page follows):`,
        lines.length ? lines.map((l) => `  ${l}`).join('\n') : '  (nothing written)',
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
    // NO temperature, deliberately: the provider rejects it on a reasoning
    // model, so the run-to-run variance is a property of the marker rather than
    // a setting we forgot. A single run therefore cannot decide the gate — the
    // eval is run repeatedly and the gate must hold every time.
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
