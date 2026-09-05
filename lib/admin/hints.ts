import { Question } from '@/lib/db';
import { earnableByMethod } from '@/lib/grade/method-marks';

/** How many method rows in the approved bank carry a hint, of how many there are (ROUND_7 Task 1). */
export async function hintCoverage(): Promise<{ withHint: number; methodRows: number }> {
  const questions = await Question.find({ status: 'approved', kind: 'structured' })
    .select('parts rubric')
    .lean<{ parts?: never[]; rubric?: { code: string; criterion: string; slot_ref: string; hint?: string }[] }[]>();
  let withHint = 0;
  let methodRows = 0;
  for (const q of questions) {
    for (const r of earnableByMethod(q as never, [])) {
      methodRows++;
      if (r.hint) withHint++;
    }
  }
  return { withHint, methodRows };
}
