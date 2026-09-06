import { Question } from '@/lib/db';

export interface ShareLine {
  /** What a student wrote — a misconception's trigger. */
  wrote: string;
  /** What the marker calls the slip. */
  slip: string;
}

const plain = (s: string) => !/[$\\{}]/.test(s);

/**
 * THE MARKED LINE ON THE SHARE IMAGE IS ONE OF OURS (ROUND_9 Task 8): the
 * first approved question, in bank order, carrying a misconception short
 * enough to draw and free of TeX. Never invented.
 */
export function pickShareLine(questions: { misconceptions?: { trigger: string; name: string }[] }[]): ShareLine | null {
  for (const q of questions) {
    for (const m of q.misconceptions ?? []) {
      if (m.trigger.length <= 28 && m.name.length <= 40 && plain(m.trigger) && plain(m.name)) {
        return { wrote: m.trigger, slip: m.name };
      }
    }
  }
  return null;
}

export async function loadShareLine(): Promise<ShareLine | null> {
  const questions = await Question.find({ status: 'approved', kind: 'structured', 'misconceptions.0': { $exists: true } })
    .sort({ _id: 1 })
    .limit(50)
    .select('misconceptions')
    .lean<{ misconceptions?: { trigger: string; name: string }[] }[]>();
  return pickShareLine(questions);
}
