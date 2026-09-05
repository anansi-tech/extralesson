// Repair the formatting defects the August audit found, in place.
//
// Regeneration was the alternative and repair is better: the questions are
// mathematically sound, the defects are in how the text was delimited, and every
// transform below is deterministic. What makes that trustworthy rather than
// hopeful is the check at the end — each repaired question is re-validated
// against the strict schema, which now contains the renderability rules, so a
// repair that did not actually fix the string cannot be saved.
//
// Previews by default; --yes applies.
// Run: pnpm tsx scripts/repair-formatting.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { StructuredQuestionZ, McqQuestionZ } from '@/lib/validation/question';
import { renderMathHtml } from '@/lib/katex';

const ESC = String.fromCharCode(27);

/** $$X$$ is display maths; this renderer spells that \[X\]. */
function fixDisplayMath(s: string): string {
  return s.replace(/\$\$([\s\S]*?)\$\$/g, (_m, body: string) => `\\[${body.trim()}\\]`);
}

/** A control character where a command belonged: ESC[vec]{AB} was \vec{AB}. */
function fixControlChars(s: string): string {
  return s.replace(new RegExp(ESC + '\\[([a-zA-Z]+)\\]', 'g'), '\\$1');
}

/**
 * A {} gap inside maths: close the maths before the gap and reopen after it.
 * "$n(A \cap B) = {}$" becomes "$n(A \cap B) =$ {}".
 *
 * Segmented the way the RENDERER segments, not by a regex over the whole
 * string. The first version of this paired a closing $ with the next opening
 * one and mangled the text — the identical bug this audit found in $$ handling,
 * reproduced in the tool written to repair it.
 */
function fixClozeGaps(s: string): string {
  return s
    .split(/(\$[^$]+\$)/g)
    .map((seg) => {
      if (!(seg.startsWith('$') && seg.endsWith('$') && seg.length > 2)) return seg;
      if (!seg.includes('{}')) return seg;
      const body = seg.slice(1, -1);
      return body
        .split('{}')
        .map((piece) => (piece.trim() === '' ? '' : `$${piece.trim()}$`))
        .join(' {} ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    })
    .join('')
    .replace(/[ \t]{2,}/g, ' ');
}

/** A ";" inside maths tears an answer in half when it is split; use a comma. */
function fixAnswerSemicolons(s: string): string {
  return s.replace(/\$([^$]*)\$/g, (whole, body: string) =>
    body.includes(';') ? `$${body.replace(/;/g, ',')}$` : whole,
  );
}

/** Labels are drawn as plain text; the delimiters would print literally. */
function stripLabelMath(s: string): string {
  return s.replace(/\$/g, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * A lone $ that never closes. There are two possible repairs — delete the
 * opener, or supply the missing closer — and which is right depends on whether
 * what follows is maths. Rather than guess, try both and keep the one that
 * balances AND renders without a KaTeX error.
 */
function fixOddDollar(s: string): string {
  if ((s.replace(/\\\$/g, '').match(/\$/g) ?? []).length % 2 === 0) return s;
  const at = s.lastIndexOf('$');
  if (at === -1) return s;

  const candidates = [s.slice(0, at) + s.slice(at + 1)];
  // Close the run at the first character that cannot belong to maths.
  const rest = s.slice(at + 1);
  const stop = rest.search(/[”"'\n]|\.\s|$/);
  if (stop > 0) candidates.push(s.slice(0, at + 1 + stop) + '$' + s.slice(at + 1 + stop));

  for (const c of candidates) {
    if ((c.replace(/\\\$/g, '').match(/\$/g) ?? []).length % 2 !== 0) continue;
    if (!renderMathHtml(c).includes('katex-error')) return c;
  }
  return candidates[0];
}

const LABEL_KEYS = new Set(['label', 'name', 'caption', 'universe_label', 't_label', 'v_label', 'set_a', 'set_b', 'set_c']);

function repairParams(value: unknown, key = ''): unknown {
  if (typeof value === 'string') return LABEL_KEYS.has(key) ? stripLabelMath(value) : value;
  if (Array.isArray(value)) {
    return key === 'headers' || key === 'labels'
      ? value.map((v) => (typeof v === 'string' ? stripLabelMath(v) : v))
      : value.map((v) => repairParams(v, key));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, repairParams(v, k)]));
  }
  return value;
}

/**
 * Even delimiters can still be mis-paired: one $ left open in part (c) and
 * another in part (d) balance each other, and every span between them is
 * shifted so the prose reads as maths. Parity cannot see it, so the repair
 * searches instead — try deleting each delimiter, and try closing each span at
 * a sentence end, and keep the first edit that leaves no prose inside maths and
 * still renders.
 */
export function fixMisPairing(input: string): string {
  let s = input;
  // One question needed two edits — a stray delimiter deleted in part (c) and a
  // span closed in part (d) — so the search runs until the damage stops
  // shrinking rather than trying a single edit and giving up.
  for (let round = 0; round < 5 && damage(s) > 0; round++) {
    const positions: number[] = [];
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '$' && s[i - 1] !== '\\') positions.push(i);
    }
    const candidates: string[] = [];
    for (const at of positions) candidates.push(s.slice(0, at) + s.slice(at + 1));
    for (const at of positions) {
      const end = s.slice(at + 1).search(/[.;]\s|[.;]$/);
      if (end > 0) candidates.push(s.slice(0, at + 1 + end) + '$' + s.slice(at + 1 + end));
    }
    let best: string | null = null;
    let bestScore = damage(s);
    for (const c of candidates) {
      if (renderMathHtml(c).includes('katex-error')) continue;
      const score = damage(c);
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (!best) break;
    s = best;
  }
  // Only accept a result that is both sane and balanced.
  return damage(s) === 0 ? s : input;
}

/**
 * What is still wrong, as one number to minimise.
 *
 * Prose-in-maths and odd parity have to be scored TOGETHER. Deleting a single
 * stray delimiter fixes the pairing and breaks the parity, and a guard that
 * demanded parity at every step threw that good intermediate away — so the
 * search could never reach the two-edit repair this question needed.
 */
function damage(text: string): number {
  const odd = (text.replace(/\\\$/g, '').match(/\$/g) ?? []).length % 2;
  // A command left outside maths prints its backslash to the student, so
  // closing a broken span is preferred over deleting its opener when both
  // otherwise score the same.
  const prose = text
    .replace(/\\\$/g, '')
    .replace(/\\\[[\s\S]*?\\\]/g, ' ')
    .replace(/\$[^$]+\$/g, ' ');
  const stranded = (prose.match(/\\[a-zA-Z]+|\\%/g) ?? []).length;
  return proseSpans(text) * 100 + stranded * 10 + odd;
}

/** How many $...$ spans hold a sentence of prose. */
export function proseSpans(text: string): number {
  return text
    .replace(/\\\$/g, '')
    .split(/(\$[^$]+\$)/g)
    .filter((seg) => {
      if (!(seg.startsWith('$') && seg.endsWith('$') && seg.length > 2)) return false;
      const body = seg.slice(1, -1);
      if (/\\text\{|\\mbox\{|\\operatorname|\\begin\{/.test(body)) return false;
      const words = body
        .replace(/\\(?:begin|end)\{[a-zA-Z*]+\}|\\[a-zA-Z]+/g, ' ')
        .replace(/[^a-zA-Z ]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter((w) => w.length >= 3 && w !== w.toUpperCase());
      return words.length >= 2;
    }).length;
}


const prose = (s: string) => fixMisPairing(fixOddDollar(fixClozeGaps(fixControlChars(fixDisplayMath(s)))));
const answer = (s: string) => fixOddDollar(fixAnswerSemicolons(fixControlChars(s)));

function repair(q: Record<string, unknown>): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  for (const f of ['stem', 'stimulus', 'worked_solution']) {
    if (typeof q[f] === 'string') d[f] = prose(q[f] as string);
  }
  if (typeof q.final_answer === 'string') d.final_answer = answer(q.final_answer);
  if (Array.isArray(q.options)) d.options = (q.options as string[]).map(answer);
  if (Array.isArray(q.misconceptions)) {
    d.misconceptions = (q.misconceptions as Record<string, string>[]).map((m) => ({
      ...m,
      trigger: answer(m.trigger),
      remediation: prose(m.remediation),
    }));
  }
  if (Array.isArray(q.rubric)) {
    d.rubric = (q.rubric as Record<string, unknown>[]).map((r) => ({
      ...r,
      criterion: prose(String(r.criterion)),
    }));
  }
  if (Array.isArray(q.parts)) {
    d.parts = (q.parts as Record<string, unknown>[]).map((p) => ({
      ...p,
      prompt: prose(String(p.prompt)),
      ...(typeof p.statement === 'string' ? { statement: prose(p.statement) } : {}),
      slots: (p.slots as Record<string, unknown>[]).map((s) => ({
        ...s,
        ...(typeof s.prompt === 'string' ? { prompt: prose(s.prompt) } : {}),
        answer: answer(String(s.answer)),
        ...(Array.isArray(s.accept) ? { accept: (s.accept as string[]).map(answer) } : {}),
      })),
    }));
  }
  if (q.visual && typeof q.visual === 'object') {
    const v = q.visual as { template: string; params: unknown };
    d.visual = { ...v, params: repairParams(v.params) };
  }
  return d;
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const qs = await Question.find({ status: { $in: ['draft', 'approved'] } }).lean<Record<string, unknown>[]>();
  const schemaFor = (q: Record<string, unknown>) => (q.kind === 'mcq' ? McqQuestionZ : StructuredQuestionZ);

  let repaired = 0;
  let stillBroken = 0;

  for (const q of qs) {
    const before = schemaFor(q).safeParse(q);
    if (before.success) continue;
    const doc = repair(q);
    const after = schemaFor(q).safeParse({ ...q, ...doc });

    const id = String(q._id).slice(-6);
    if (!after.success) {
      stillBroken++;
      console.log(`  ! ${id} still fails after repair: ${after.error.issues[0]?.message.slice(0, 80)}`);
      continue;
    }
    repaired++;
    if (repaired <= 5) {
      const f = Object.keys(doc).find((k) => JSON.stringify(doc[k]) !== JSON.stringify(q[k]));
      console.log(`  ✓ ${id} repaired (${f ?? 'fields'})`);
    }
    if (apply) await Question.updateOne({ _id: q._id }, { $set: doc });
  }

  console.log(`\n${repaired} repaired and now valid; ${stillBroken} still failing.`);
  console.log(apply ? 'applied' : 'preview only — re-run with --yes');
  process.exit(0);
}

// Only when run as a script: the helpers are imported by tests and by ad-hoc
// checks, and an import must not start a database write.
if (process.argv[1]?.endsWith('repair-formatting.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
