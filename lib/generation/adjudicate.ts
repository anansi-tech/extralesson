import { z } from 'zod';
import { generateObject } from 'ai';
import { model } from '@/lib/ai';

// Last step of the independent-solve gate (ROUND_1_5 §5). Mechanical
// equivalence cannot settle prose, and a rule per notation kept rejecting
// correct drafts, so a skeptical reader decides what rules cannot. It runs ONLY
// on a part the mechanical check has already failed, so no draft is accepted
// without at least one of the two agreeing.

const VerdictZ = z.object({
  same: z.boolean(),
  reason: z.string().max(240),
});

export interface Verdict {
  same: boolean;
  reason: string;
}

const FRAMING: Record<string, string> = {
  answer: 'Both should be the final answer to the part.',
  show_that:
    'The part states the result and asks for the derivation, so both should end at that same stated result. Say they differ if B reaches a different result, or reports that the stated result is wrong.',
  explain:
    'The part asks for a reason, so both are reasons. Two correct reasons worded differently are the same answer; a reason that rests on different mathematics is not.',
};

export async function adjudicateAnswers(args: {
  partPrompt: string;
  draftAnswer: string;
  solveAnswer: string;
  mode?: string;
}): Promise<Verdict> {
  const { object } = await generateObject({
    model,
    schema: VerdictZ,
    prompt: `Two people answered the same CSEC Mathematics question part independently. Decide whether they gave the SAME answer.

QUESTION PART: ${args.partPrompt}
${FRAMING[args.mode ?? 'answer'] ?? FRAMING.answer}

ANSWER A: ${args.draftAnswer}
ANSWER B: ${args.solveAnswer}

Ignore differences of notation, labelling, ordering, wording and layout: $f^{-1}(x)=\\frac{x-1}{2}$, "x ↦ (x-1)/2" and "f: x → (x-1)/2" are the same answer, and so are "No" and "No, because fg(x) and gf(x) have different rules".

One answer carrying MORE than the other is not a difference: if A gives a value together with the reasoning or justification behind it and B gives the same value alone, they are the SAME answer, and the same holds with A and B swapped.

Say they DIFFER — set same=false — when any value, sign, expression, root, unit or conclusion differs, when one answers a different question than the other, or when one states a mathematical claim the other contradicts. Being WRONG is a difference; being briefer is not. If you are unsure, say they differ.

Return {"same": <boolean>, "reason": "<one short sentence>"}.`,
  });
  return object;
}
