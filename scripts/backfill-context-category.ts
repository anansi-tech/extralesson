// Tag the settings of questions written before the setting ledger existed.
//
// R1.8 Part 0 measures whether the bank is monotonous by counting how often it
// reaches for the same setting. 33 questions predate context_category, and an
// untagged question is invisible to that count — it neither shows a skew nor
// clears one, so a quarter of the P1 distribution was simply unknown.
//
// The rules below are keyword rules over the stem, and their known weakness is
// the fallback: a question whose actor is not in the isBare() list is called
// bare, which inflates the very share we are trying to measure. That is
// acceptable HERE and only here — this runs once over 33 questions and every
// assignment was read before it was applied. It is not a classifier to reach
// for again on unread data.
//
// Previews by default; --yes applies.
// Run: pnpm tsx scripts/backfill-context-category.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import type { ContextCategory } from '@/lib/types';

// Ordered: the first match wins, so the more specific setting is listed first.
//
// Every alternative is wrapped in its own group so the word boundaries bind to
// all of them. Written as /\bcement|roofing\b/ the boundaries anchor only the
// first and last alternative, and the rest match INSIDE longer words: the first
// draft of this filed a vector question under construction because "cement" is
// in "displacement".
const word = (...alternatives: string[]) => new RegExp(`\\b(?:${alternatives.join('|')})\\b`, 'i');

const RULES: [ContextCategory, RegExp][] = [
  ['fishing', word('fisher(?:man|men)?', 'fishing', 'trawler', 'fish market')],
  ['environment', word('nature (?:trail|reserve)', 'marine (?:reserve|laboratory)', 'seawater', 'rainfall', 'watershed', 'conservation', 'wildlife')],
  ['construction', word('surveyor', 'scaffold', 'flagpole', 'guy wire', 'builder', 'mason', 'cement', 'roofing', 'foundation')],
  ['transport', word('coastguard', 'jetty', 'marina', 'courier', 'delivery', 'bus', 'taxi', 'ferry', 'journey', 'distance-time')],
  ['manufacturing', word('craft (?:worker|club)', 'workshop', 'factory', 'assembles')],
  ['school', word('school', 'classroom', 'student', 'youth camp', 'canteen')],
  ['retail', word('shop', 'store', 'stall', 'vendor', 'sachets', 'discount', 'sale price', 'sells')],
  ['agriculture', word('farmer', 'farm', 'crop', 'harvest', 'garden', 'plantation', 'livestock')],
  ['household', word('household', 'kitchen', 'water tank', 'electricity bill', 'rent')],
  ['sport', word('cricket', 'football', 'athlete', 'race', 'tournament')],
  ['tourism', word('tourist', 'hotel', 'resort', 'excursion', 'visitor')],
  ['health', word('clinic', 'patient', 'nurse', 'dosage', 'blood')],
  ['wages', word('wage', 'salary', 'overtime', 'hourly rate')],
  ['banking', word('interest rate', 'principal', 'loan', 'savings account', 'compound interest')],
  ['events', word('fair', 'festival', 'concert', 'carnival', 'fund-?raiser')],
];

/**
 * A stem with no setting at all: pure symbols, named shapes, functions,
 * matrices, a lettered figure. This is the paper's most common Paper 1 item
 * and it must be recognised positively, not as "no rule matched".
 *
 * It recognises a setting by its ACTOR, from a list, so an actor the list does
 * not know reads as bare. Every assignment this made was reviewed by eye
 * before being applied; on unreviewed data the error would be silent.
 */
function isBare(text: string): boolean {
  // Up to two words may sit between the article and the actor, so "a craft
  // club" and "a school-supply retailer" read as settings rather than as bare
  // symbolic work.
  return !/\b(?:a|an|the)\s+(?:[a-z-]+\s+){0,2}(?:shop|worker|club|company|group|team|farmer|driver|owner|operator|retailer|service|laboratory|camp|centre|school|stall|vendor|surveyor|courier)\b/i.test(
    text,
  );
}

export function categorise(text: string): ContextCategory | null {
  for (const [category, pattern] of RULES) {
    if (pattern.test(text)) return category;
  }
  return isBare(text) ? 'none' : null;
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const qs = await Question.find({ context_category: { $exists: false } }).lean<
    { _id: unknown; kind: string; status: string; stimulus?: string; stem: string }[]
  >();

  const unplaced: string[] = [];
  const counts = new Map<string, number>();

  for (const q of qs) {
    const text = `${q.stimulus ?? ''} ${q.stem}`;
    const category = categorise(text);
    const line = `${String(q._id).slice(-6)} [${q.kind}] ${text.replace(/\s+/g, ' ').slice(0, 96)}`;
    if (!category) {
      unplaced.push(line);
      continue;
    }
    counts.set(category, (counts.get(category) ?? 0) + 1);
    console.log(`  ${category.padEnd(14)} ${line}`);
    if (apply) await Question.updateOne({ _id: q._id }, { $set: { context_category: category } });
  }

  console.log(`\n${qs.length} untagged: ${qs.length - unplaced.length} placed, ${unplaced.length} not.`);
  for (const [c, n] of [...counts].sort((a, b) => b[1] - a[1])) console.log(`  ${c.padEnd(14)} ${n}`);
  if (unplaced.length) {
    console.log('\nNo rule placed these — left untagged rather than guessed:');
    for (const line of unplaced) console.log(`  ${line}`);
  }
  console.log(apply ? '\napplied' : '\npreview only — re-run with --yes');
  process.exit(0);
}

// Only when run as a script: categorise() is imported by its tests, and a unit
// test must not open a database connection as a side effect of an import.
if (process.argv[1]?.endsWith('backfill-context-category.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
