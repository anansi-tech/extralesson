/**
 * A SLOT THAT PAYS TWICE FOR READING ONE VALUE OFF THE PAGE.
 *
 * The first version of this asked the solver whether a part's answer was
 * "readable off the figure". That is a model flag: across three runs of the
 * whole bank it agreed with itself on 42 of 63 slots and produced 21 it only
 * saw once or twice, so a third of what it refused was noise. A gate that
 * refuses an edit needs a reason that does not change between two presses of
 * Save.
 *
 * So the question is asked of the RUBRIC, which is written down. A row that
 * reads, states, identifies, recognises or awards the answer outright pays for
 * knowing where to look; a row that substitutes, solves, rearranges or
 * evaluates pays for work. Where EVERY row on a slot is the first kind and they
 * come to two marks or more, the question is paying twice to be told a value it
 * has already drawn.
 *
 * Reading a value off a graph is a real one-mark demand and the papers set it
 * constantly, which is why the gate is two marks and not one.
 */
const READS = /^\s*(?:reads?|states?|writes\s+down|gives|names|lists?|identif(?:ies|y)|recognis(?:es|e)|recogniz(?:es|e))\b/i;
const CAO = /\bcao\b/i;

/**
 * A row that pays for WORK, whatever else it also says. "CAO" is a marking
 * convention and attaches to any final-answer row, including one that was
 * earned — "Substitutes their f(x) into g and simplifies, CAO 2x + 7" is not a
 * read. So a row counts as reading only when no work is named in it.
 */
const WORKS = /\b(?:substitut|solv|evaluat|calculat|rearrang|simplif|form|factor|expand|subtract|add|multipl|divid|convert|obtain|appl|us(?:es|e|ing)|comput|deriv|construct|measur|count|sum|round|estimat|interpret|compar|find|locat|order|arrang|plot|draw|shad|complet)/i;

/**
 * WORK NAMED IN PROSE, with no verb to catch it by. "Identifies the discount as
 * 15% of the marked price" beside "CAO $360" is a percentage calculation, and
 * nine slots in the bank are written exactly that way; so is arithmetic spelt
 * out as an expression, and so is a named theorem.
 */
const WORK_IN_PROSE = [
  // The $ are KaTeX delimiters and sit between every part of it: the bank
  // writes this as "as $15\\%$ of the marked price".
  /\bas\s+\$?\s*\d+(?:\.\d+)?\s*\\?%\s*\$?\s*of\b/i,
  /\b\d+(?:\.\d+)?\s*\\?%\s*\$?\s*of\s+the\b/i,
  /\\times|\\div|\\sqrt|\\frac|\d\s*[+\-*/×÷]\s*\d/, // arithmetic written out
  /\btheorem\b|angle at the cent|angle subtended|tangent and a chord|\bsimilar\b|\bcongruent\b|pythagor/i,
];

/**
 * WHERE it is the exact shape the gate refuses: two rows over a figure, one
 * saying where to look and one giving the value. Everything else this finds is
 * reported and not refused — bucket (c) of the bank sweep was half real and
 * half a rubric that names its work in prose.
 */
const WHERE = /^\s*(?:identif|recognis|recogniz|reads?\s+that)/i;
const VALUE = /\bcao\b|^\s*(?:reads?|states?|gives|writes|lists?|names)\b/i;

export interface ReadOffSlot {
  ref: string;
  marks: number;
  shape: 'exact' | 'other';
  /** The row that only says where to look — the one a fix drops. */
  dropCode?: string;
  criteria: string[];
}

/** Every slot in the draft whose whole rubric is reading, worth two or more. */
interface Row { code: string; slot_ref: string; mark_value: number; criterion: string }

export function readOffSlots(draft: { rubric?: Row[]; visual?: unknown }): ReadOffSlot[] {
  const bySlot = new Map<string, Row[]>();
  for (const row of draft.rubric ?? []) {
    bySlot.set(row.slot_ref, [...(bySlot.get(row.slot_ref) ?? []), row]);
  }
  const out: ReadOffSlot[] = [];
  for (const [ref, rows] of bySlot) {
    const marks = rows.reduce((n, r) => n + r.mark_value, 0);
    if (marks < 2) continue;
    if (rows.some((r) => WORKS.test(r.criterion))) continue;
    if (rows.some((r) => WORK_IN_PROSE.some((p) => p.test(r.criterion)))) continue;
    if (!rows.every((r) => READS.test(r.criterion) || CAO.test(r.criterion))) continue;

    const where = rows.filter((r) => WHERE.test(r.criterion) && !CAO.test(r.criterion));
    const exact = Boolean(draft.visual) && rows.length === 2 && where.length === 1
      && rows.some((r) => r.code !== where[0].code && VALUE.test(r.criterion));
    out.push({
      ref,
      marks,
      shape: exact ? 'exact' : 'other',
      ...(exact ? { dropCode: where[0].code } : {}),
      criteria: rows.map((r) => `${r.code} ${r.mark_value}m ${r.criterion}`),
    });
  }
  return out;
}
