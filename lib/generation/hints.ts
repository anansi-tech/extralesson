import { z } from 'zod';
import { generateObject } from 'ai';
import { model } from '@/lib/ai';
import { MARK_SCHEME_CONVENTIONS } from '@/lib/prompts/mark-scheme';
import { hintProblems, plainYour, repairTex } from './hint-tex';

/**
 * ONE GENERATOR FOR EVERY HINT: the batch script and the review card's
 * approval both come here, so a hint written at approval passes the same
 * checks as one written in a batch (ROUND_7 follow-up).
 */
export type HintTarget = { stem: string; worked_solution: string };
export type HintRowTarget = { code: string; criterion: string };

const HintsZ = z.object({ hints: z.array(z.object({ code: z.string(), hint: z.string().min(1) })) });

const PROMPT_RULES =
  `You write ONE sentence per mark-scheme row for a CSEC Mathematics student who got that part wrong.\n` +
  `Second person, present tense, addressed to the student ("Find where the two lines cross — that's where the retained amounts are equal.").\n` +
  `Say what to DO, not what the scheme awards; never the words "mark", "criterion", "award", "their". No answer values. British spelling throughout (factorise, recognise, centre, metres).\n` +
  `Plain text with TeX only where the criterion has it, and every TeX command the criterion uses appears in the hint with its backslash. ` +
  `All TeX sits inside $...$ — never \\( \\) and never a bare command outside dollars. Money is written \\$ (backslash-dollar), never a bare $. Write your without quotation marks. ` +
  `Inside the JSON string, write every backslash DOUBLED: "$\\\\overrightarrow{OA}$", "$x \\\\ge 20$".\n`;


async function hintsFor(q: HintTarget, wanted: HintRowTarget[]): Promise<Map<string, string>> {
  const result = await generateObject({
    model,
    schema: HintsZ,
    prompt:
      PROMPT_RULES +
      `\n${MARK_SCHEME_CONVENTIONS}\n\n` +
      `QUESTION: ${q.stem}\n\nSOLUTION (for you, never quoted): ${q.worked_solution}\n\n` +
      `ROWS:\n${wanted.map((r) => `${r.code}: ${r.criterion}`).join('\n')}\n\nReturn one hint per row, by code.`,
  });
  const out = new Map<string, string>();
  for (const r of wanted) {
    const raw = result.object.hints.find((h) => h.code === r.code)?.hint.trim();
    if (raw) out.set(r.code, plainYour(repairTex(raw, r.criterion)));
  }
  return out;
}

/** One retry for a row still missing a command; a second miss fails the batch. */
export async function checkedHints(q: HintTarget, wanted: HintRowTarget[]): Promise<Map<string, string>> {
  const hints = await hintsFor(q, wanted);
  const short = wanted.filter((r) => hints.has(r.code) && hintProblems(hints.get(r.code)!, r.criterion).length > 0);
  if (short.length) {
    const again = await hintsFor(q, short);
    for (const r of short) if (again.has(r.code)) hints.set(r.code, again.get(r.code)!);
  }
  for (const r of wanted) {
    const problems = hints.has(r.code) ? hintProblems(hints.get(r.code)!, r.criterion) : [];
    if (problems.length) throw new Error(`hint for ${r.code} "${hints.get(r.code)}" ${problems.join('; ')} (criterion "${r.criterion}")`);
  }
  return hints;
}

/** The hints for these rows, or which rows failed and why — never a throw, so a screen can show it. */
export async function hintsOrProblems(q: HintTarget, wanted: HintRowTarget[]): Promise<{ hints: Map<string, string>; problems: { code: string; hint?: string; problem: string }[] }> {
  const hints = await hintsFor(q, wanted);
  const problems: { code: string; hint?: string; problem: string }[] = [];
  const short = wanted.filter((r) => !hints.has(r.code) || hintProblems(hints.get(r.code)!, r.criterion).length > 0);
  if (short.length) {
    const again = await hintsFor(q, short);
    for (const r of short) if (again.has(r.code)) hints.set(r.code, again.get(r.code)!);
  }
  for (const r of wanted) {
    const hint = hints.get(r.code);
    if (!hint) {
      problems.push({ code: r.code, problem: 'no hint returned' });
      continue;
    }
    for (const p of hintProblems(hint, r.criterion)) problems.push({ code: r.code, hint, problem: p });
  }
  return { hints, problems };
}
